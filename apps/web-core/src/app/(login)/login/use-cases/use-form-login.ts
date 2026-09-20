import { useState } from 'react';
import { ApiRequest } from '@/utils/api-request';
import { useRouter } from 'next/navigation';

export const UseFormLogin = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) return;

    setLoading(true);
    try {
      // Llama a la API interna de Next.js (route.ts en /api/auth/login)
      const response = await ApiRequest<{ email: string; password: string }, any>('auth/login', 'POST', {
        email,
        password,
      });

      console.log('Login exitoso:', JSON.stringify(response, null, 2));

      // Activamos el estado de éxito para mostrar el Splash
      setIsSuccess(true);

      // Pequeño delay para que se aprecie el splash premium
      setTimeout(() => {
        router.push('/home');
      }, 1800);
    } catch (error: any) {
      console.error('Error de login:', error.message);
      alert('Error: ' + error.message);
      setLoading(false);
    }
  };

  return {
    email,
    password,
    handleEmailChange,
    handlePasswordChange,
    login,
    loading,
    isSuccess,
  };
};
