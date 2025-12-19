import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { verifyInternalToken, blockInProduction } from '@/lib/security/internal-auth'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    blockInProduction()
    verifyInternalToken(request)

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const results = {
      tenantA: null as any,
      tenantB: null as any,
      storeA: null as any,
      storeB: null as any,
      userA: null as any,
      userB: null as any,
      productA: null as any,
      productB: null as any,
      customerA: null as any,
      customerB: null as any,
      orderA: null as any,
      orderB: null as any,
    }

    const userAEmail = process.env.E2E_USER_A_EMAIL || 'e2e-user-a@test.local'
    const userBEmail = process.env.E2E_USER_B_EMAIL || 'e2e-user-b@test.local'

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userAExists = existingUsers?.users.find(u => u.email === userAEmail)
    const userBExists = existingUsers?.users.find(u => u.email === userBEmail)

    if (userAExists) {
      await supabase.auth.admin.deleteUser(userAExists.id)
    }
    if (userBExists) {
      await supabase.auth.admin.deleteUser(userBExists.id)
    }

    await supabase.from('tenants').delete().ilike('name', 'E2E Tenant%')

    const { data: tenantA, error: tenantAError } = await supabase
      .from('tenants')
      .insert({
        name: 'E2E Tenant A',
        status: 'active',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (tenantAError) throw new Error(`Tenant A: ${tenantAError.message}`)
    results.tenantA = tenantA

    const { data: tenantB, error: tenantBError } = await supabase
      .from('tenants')
      .insert({
        name: 'E2E Tenant B',
        status: 'active',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (tenantBError) throw new Error(`Tenant B: ${tenantBError.message}`)
    results.tenantB = tenantB

    const { data: storeA, error: storeAError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenantA.id,
        name: 'E2E Store A',
        slug: 'e2e-store-a',
        niche: 'burger',
        mode: 'store',
        is_active: true,
      })
      .select()
      .single()

    if (storeAError) throw new Error(`Store A: ${storeAError.message}`)
    results.storeA = storeA

    const { data: storeB, error: storeBError } = await supabase
      .from('stores')
      .insert({
        tenant_id: tenantB.id,
        name: 'E2E Store B',
        slug: 'e2e-store-b',
        niche: 'burger',
        mode: 'store',
        is_active: true,
      })
      .select()
      .single()

    if (storeBError) throw new Error(`Store B: ${storeBError.message}`)
    results.storeB = storeB

    const userAPassword = process.env.E2E_USER_A_PASSWORD || 'Test123456!'

    const { data: authUserA, error: authUserAError } = await supabase.auth.admin.createUser({
      email: userAEmail,
      password: userAPassword,
      email_confirm: true,
    })

    if (authUserAError) throw new Error(`Auth User A: ${authUserAError.message}`)

    const { data: userA, error: userAError } = await supabase
      .from('users')
      .insert({
        id: authUserA.user.id,
        email: userAEmail,
        name: 'E2E User A',
      })
      .select()
      .single()

    if (userAError) throw new Error(`User A: ${userAError.message}`)
    results.userA = { ...userA, email: userAEmail }

    const { error: storeUserAError } = await supabase
      .from('store_users')
      .insert({
        store_id: storeA.id,
        user_id: userA.id,
        role: 'OWNER',
      })

    if (storeUserAError) throw new Error(`Store User A: ${storeUserAError.message}`)

    const userBPassword = process.env.E2E_USER_B_PASSWORD || 'Test123456!'

    const { data: authUserB, error: authUserBError } = await supabase.auth.admin.createUser({
      email: userBEmail,
      password: userBPassword,
      email_confirm: true,
    })

    if (authUserBError) throw new Error(`Auth User B: ${authUserBError.message}`)

    const { data: userB, error: userBError } = await supabase
      .from('users')
      .insert({
        id: authUserB.user.id,
        email: userBEmail,
        name: 'E2E User B',
      })
      .select()
      .single()

    if (userBError) throw new Error(`User B: ${userBError.message}`)
    results.userB = { ...userB, email: userBEmail }

    const { error: storeUserBError } = await supabase
      .from('store_users')
      .insert({
        store_id: storeB.id,
        user_id: userB.id,
        role: 'OWNER',
      })

    if (storeUserBError) throw new Error(`Store User B: ${storeUserBError.message}`)

    const { data: categoryA, error: categoryAError } = await supabase
      .from('categories')
      .insert({
        store_id: storeA.id,
        name: 'E2E Category A',
      })
      .select()
      .single()

    if (categoryAError) throw new Error(`Category A: ${categoryAError.message}`)

    const { data: categoryB, error: categoryBError } = await supabase
      .from('categories')
      .insert({
        store_id: storeB.id,
        name: 'E2E Category B',
      })
      .select()
      .single()

    if (categoryBError) throw new Error(`Category B: ${categoryBError.message}`)

    const { data: productA, error: productAError } = await supabase
      .from('products')
      .insert({
        store_id: storeA.id,
        category_id: categoryA.id,
        name: 'E2E Product A',
        base_price: 10.0,
        unit_type: 'unit',
        is_active: true,
      })
      .select()
      .single()

    if (productAError) throw new Error(`Product A: ${productAError.message}`)
    results.productA = productA

    const { data: productB, error: productBError } = await supabase
      .from('products')
      .insert({
        store_id: storeB.id,
        category_id: categoryB.id,
        name: 'E2E Product B',
        base_price: 20.0,
        unit_type: 'unit',
        is_active: true,
      })
      .select()
      .single()

    if (productBError) throw new Error(`Product B: ${productBError.message}`)
    results.productB = productB

    const { data: customerA, error: customerAError } = await supabase
      .from('customers')
      .insert({
        store_id: storeA.id,
        name: 'E2E Customer A',
        phone: '+5511000000001',
      })
      .select()
      .single()

    if (customerAError) throw new Error(`Customer A: ${customerAError.message}`)
    results.customerA = customerA

    const { data: customerB, error: customerBError } = await supabase
      .from('customers')
      .insert({
        store_id: storeB.id,
        name: 'E2E Customer B',
        phone: '+5511000000002',
      })
      .select()
      .single()

    if (customerBError) throw new Error(`Customer B: ${customerBError.message}`)
    results.customerB = customerB

    const { data: orderA, error: orderAError } = await supabase
      .from('orders')
      .insert({
        store_id: storeA.id,
        customer_id: customerA.id,
        code: 'E2E-A-001',
        channel: 'DELIVERY',
        status: 'PENDING',
        subtotal_amount: 10.0,
        discount_amount: 0,
        delivery_fee: 5.0,
        total_amount: 15.0,
        payment_method: 'CASH',
      })
      .select()
      .single()

    if (orderAError) throw new Error(`Order A: ${orderAError.message}`)
    results.orderA = orderA

    const { data: orderB, error: orderBError } = await supabase
      .from('orders')
      .insert({
        store_id: storeB.id,
        customer_id: customerB.id,
        code: 'E2E-B-001',
        channel: 'DELIVERY',
        status: 'PENDING',
        subtotal_amount: 20.0,
        discount_amount: 0,
        delivery_fee: 5.0,
        total_amount: 25.0,
        payment_method: 'CASH',
      })
      .select()
      .single()

    if (orderBError) throw new Error(`Order B: ${orderBError.message}`)
    results.orderB = orderB

    const fixturesPath = join(process.cwd(), 'audit', 'fixtures', 'e2e_seed.json')
    writeFileSync(fixturesPath, JSON.stringify(results, null, 2))

    return NextResponse.json({
      success: true,
      message: 'E2E seed completed successfully',
      fixtures: results,
      fixturesPath,
    })
  } catch (error: any) {
    console.error('E2E seed error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
