import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { LoginForm } from './login-form';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return {
    title: t('loginTitle'),
    description: t('loginDescription'),
  };
}

export default async function LoginPage() {
  const t = await getTranslations('Auth');

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('loginHeading')}</CardTitle>
        <CardDescription>
          {t('loginSubheading')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            {t('signupLink')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
