'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/components/ui';
import { signup } from '@/actions/auth';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { useTranslations } from 'next-intl';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('Auth');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setError(null);
    const result = await signup(data);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" required>{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" required>{t('password')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" required>{t('username')}</Label>
        <div className="flex items-center">
          <span className="text-muted-foreground text-sm mr-1">sellio.me/u/</span>
          <Input
            id="username"
            placeholder="yourname"
            error={!!errors.username}
            {...register('username')}
          />
        </div>
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('usernameHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName" required>{t('displayName')}</Label>
        <Input
          id="displayName"
          placeholder={t('displayNamePlaceholder')}
          error={!!errors.displayName}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {t('signupButton')}
      </Button>
    </form>
  );
}
