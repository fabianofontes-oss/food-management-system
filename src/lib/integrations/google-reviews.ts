// Integração com Google My Business API para Reviews
// Documentação: https://developers.google.com/my-business/reference/rest

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  : 'http://localhost:3000/api/integrations/google/callback'

// Scopes necessários para acessar reviews do Google My Business
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
]

export interface GoogleReview {
  reviewId: string
  reviewer: {
    displayName: string
    profilePhotoUrl?: string
  }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: {
    comment: string
    updateTime: string
  }
}

export interface GoogleLocation {
  name: string
  locationName: string
  primaryCategory?: {
    displayName: string
  }
  address?: {
    addressLines: string[]
    locality: string
    regionCode: string
  }
}

// Converter rating do Google para número
export function googleRatingToNumber(rating: string): number {
  const map: Record<string, number> = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  }
  return map[rating] || 5
}

// Gerar URL de autorização OAuth
export function getGoogleAuthUrl(storeId: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: storeId // Passamos o storeId no state para recuperar depois
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// Trocar código por tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao trocar código: ${error}`)
  }
  
  return response.json()
}

// Renovar access token usando refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })
  
  if (!response.ok) {
    throw new Error('Erro ao renovar token')
  }
  
  return response.json()
}

// Buscar contas do Google My Business
export async function getAccounts(accessToken: string): Promise<any[]> {
  const response = await fetch(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao buscar contas')
  }
  
  const data = await response.json()
  return data.accounts || []
}

// Buscar localizações (estabelecimentos) de uma conta
export async function getLocations(accessToken: string, accountId: string): Promise<GoogleLocation[]> {
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao buscar localizações')
  }
  
  const data = await response.json()
  return data.locations || []
}

// Buscar reviews de uma localização
export async function getReviews(
  accessToken: string, 
  locationName: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{ reviews: GoogleReview[], nextPageToken?: string }> {
  let url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${pageSize}`
  if (pageToken) {
    url += `&pageToken=${pageToken}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao buscar reviews: ${error}`)
  }
  
  const data = await response.json()
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken
  }
}

// Responder a um review
export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<void> {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment })
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao responder review')
  }
}

// Deletar resposta de um review
export async function deleteReviewReply(
  accessToken: string,
  reviewName: string
): Promise<void> {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Erro ao deletar resposta')
  }
}
