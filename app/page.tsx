import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/authOptions';
import { redirect } from 'next/navigation';
import { MainPage } from '@/components/pages/MainPage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }
  return (
    <MainPage />
  );
};
