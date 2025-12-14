import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  getAccounts, 
  getLocations, 
  getReviews, 
  googleRatingToNumber,
  refreshAccessToken 
} from '@/lib/integrations/google-reviews'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { integrationId, storeId } = await request.json()

    if (!integrationId || !storeId) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar integração
    const { data: integration, error: intError } = await supabase
      .from('review_integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (intError || !integration) {
      return NextResponse.json({ error: 'Integração não encontrada' }, { status: 404 })
    }

    let accessToken = integration.access_token

    // Verificar se token expirou
    if (new Date(integration.token_expires_at) < new Date()) {
      // Renovar token
      const newTokens = await refreshAccessToken(integration.refresh_token)
      accessToken = newTokens.access_token

      // Atualizar no banco
      await supabase
        .from('review_integrations')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
        })
        .eq('id', integrationId)
    }

    // Criar log de sincronização
    const { data: syncLog } = await supabase
      .from('review_sync_logs')
      .insert({
        store_id: storeId,
        integration_id: integrationId,
        status: 'started'
      })
      .select()
      .single()

    let reviewsImported = 0
    let reviewsUpdated = 0

    try {
      // Buscar contas
      const accounts = await getAccounts(accessToken)
      
      if (accounts.length === 0) {
        throw new Error('Nenhuma conta Google My Business encontrada')
      }

      // Para cada conta, buscar localizações
      for (const account of accounts) {
        const locations = await getLocations(accessToken, account.name)
        
        // Para cada localização, buscar reviews
        for (const location of locations) {
          let pageToken: string | undefined
          
          do {
            const { reviews, nextPageToken } = await getReviews(
              accessToken, 
              location.name,
              50,
              pageToken
            )
            
            pageToken = nextPageToken

            // Importar cada review
            for (const review of reviews) {
              const existingReview = await supabase
                .from('external_reviews')
                .select('id')
                .eq('store_id', storeId)
                .eq('platform', 'google')
                .eq('external_id', review.reviewId)
                .single()

              const reviewData = {
                store_id: storeId,
                integration_id: integrationId,
                platform: 'google',
                external_id: review.reviewId,
                customer_name: review.reviewer.displayName,
                customer_avatar: review.reviewer.profilePhotoUrl || null,
                rating: googleRatingToNumber(review.starRating),
                comment: review.comment || null,
                reply: review.reviewReply?.comment || null,
                replied_at: review.reviewReply?.updateTime || null,
                review_date: review.createTime,
                is_visible: true,
                raw_data: review
              }

              if (existingReview?.data) {
                // Atualizar review existente
                await supabase
                  .from('external_reviews')
                  .update(reviewData)
                  .eq('id', existingReview.data.id)
                reviewsUpdated++
              } else {
                // Inserir novo review
                await supabase
                  .from('external_reviews')
                  .insert(reviewData)
                reviewsImported++
              }
            }
          } while (pageToken)
        }
      }

      // Atualizar log de sucesso
      await supabase
        .from('review_sync_logs')
        .update({
          status: 'success',
          reviews_imported: reviewsImported,
          reviews_updated: reviewsUpdated,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog?.id)

      // Atualizar integração
      await supabase
        .from('review_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          total_reviews: reviewsImported + reviewsUpdated
        })
        .eq('id', integrationId)

      return NextResponse.json({
        success: true,
        imported: reviewsImported,
        updated: reviewsUpdated
      })

    } catch (syncError: any) {
      // Atualizar log de erro
      await supabase
        .from('review_sync_logs')
        .update({
          status: 'failed',
          error_message: syncError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog?.id)

      // Atualizar integração com erro
      await supabase
        .from('review_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
          last_sync_error: syncError.message
        })
        .eq('id', integrationId)

      throw syncError
    }

  } catch (err: any) {
    console.error('Erro na sincronização:', err)
    return NextResponse.json(
      { error: err.message || 'Erro na sincronização' }, 
      { status: 500 }
    )
  }
}
