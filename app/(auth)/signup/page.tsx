import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { SignupForm } from './signup-form';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth');
  return {
    title: t('signupTitle'),
    description: t('signupDescription'),
  };
}

export default async function SignupPage() {
  const t = await getTranslations('Auth');

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('signupHeading')}</CardTitle>
        <CardDescription>
          {t('signupSubheading')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t('loginLink')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
