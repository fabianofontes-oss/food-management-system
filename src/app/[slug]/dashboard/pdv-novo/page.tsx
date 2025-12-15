import { permanentRedirect } from 'next/navigation'

export default async function PDVNovoRedirect({
  params,
}: {
  params: { slug: string }
}) {
  permanentRedirect(`/${params.slug}/dashboard/pos`)
}
