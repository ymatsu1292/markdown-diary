import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/authOptions';
import { redirect } from 'next/navigation';
import { MainPage } from '@/components/pages/MainPage';
import logger from '@/utils/logger';

export default async function Home() {
  const session = await getServerSession(authOptions);
  logger.debug("app/page.ts - Home(): START");

  if (!session) {
    logger.debug("app/page.ts - Home(): セッションがないのでサインインに遷移");
    redirect('/api/auth/signin');
  }
  logger.debug("app/page.ts - Home(): END");
  return (
    <MainPage />
  );
};
