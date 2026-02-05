'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Label } from '@/components/ui';
import { signup } from '@/actions/auth';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  
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
        <Label htmlFor="email" required>อีเมล</Label>
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
        <Label htmlFor="password" required>รหัสผ่าน</Label>
        <Input
          id="password"
          type="password"
          placeholder="อย่างน้อย 6 ตัวอักษร"
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username" required>Username</Label>
        <div className="flex items-center">
          <span className="text-muted-foreground text-sm mr-1">store.app/u/</span>
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
          ใช้ได้เฉพาะ a-z, 0-9 และ _ เท่านั้น
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName" required>ชื่อที่แสดง</Label>
        <Input
          id="displayName"
          placeholder="ชื่อร้านหรือชื่อของคุณ"
          error={!!errors.displayName}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        สมัครสมาชิก
      </Button>
    </form>
  );
}
