import { permanentRedirect } from 'next/navigation'

export default async function POSNewRedirect({
  params,
}: {
  params: { slug: string }
}) {
  permanentRedirect(`/${params.slug}/dashboard/pos`)
}
