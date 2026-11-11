import { redirect } from 'next/navigation';

export default async function ReleaseRequestsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (typeof val === 'string') {
      params.set(key, val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => params.append(key, v));
    }
  }
  const query = params.toString();
  redirect(`/requests${query ? `?${query}` : ''}`);
}

