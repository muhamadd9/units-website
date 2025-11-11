import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
// removed logo

const Login = () => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string; password: string }>();

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const onSubmit = async ({ email, password }: { email: string; password: string }) => {
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Authentication failed');
        }
    };

    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="flex-1 flex items-center justify-center py-24 px-4 min-h-[80vh]">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center space-y-3 py-6">
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Sign in to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email', { required: true })}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', { required: true, minLength: 6 })}
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Please wait...' : 'Sign In'}
                            </Button>

                            <div className="text-center text-sm">
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="text-primary hover:underline"
                                >
                                    Don't have an account? Sign up
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;


