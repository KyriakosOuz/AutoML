
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Mail, Lock, Github, Chrome, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to dataset page
  if (user) {
    navigate("/dataset");
    return null;
  }

  // Load hCaptcha script - commented out for now
  useEffect(() => {
    /*
    if (typeof window !== 'undefined' && !window.hcaptcha) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setCaptchaLoaded(true);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    } else {
      setCaptchaLoaded(true);
    }
    */
    // Just set captchaLoaded to true since we're bypassing it
    setCaptchaLoaded(true);
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("email", email, password);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    await signIn(provider);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Cpu className="h-10 w-10 text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">KyrO AutoML</h1>
          <p className="text-gray-600 mt-2">Sign in to access your datasets and models</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Sign in to your account using your preferred method.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OAuth Providers */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 h-10"
                    onClick={() => handleOAuthSignIn("google")}
                  >
                    <Chrome className="h-4 w-4" />
                    <span>Google</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 h-10"
                    onClick={() => handleOAuthSignIn("github")}
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </Button>
                </div>

                <div className="relative flex items-center justify-center my-6">
                  <Separator className="w-full" />
                  <span className="absolute bg-gray-50 text-gray-500 text-xs px-2">OR</span>
                </div>

                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* hCaptcha Container - Commented out for development */}
                  {/*
                  <div className="flex justify-center my-4">
                    <div className="h-captcha" data-sitekey="YOUR_HCAPTCHA_SITE_KEY" data-theme="light"></div>
                  </div>
                  
                  <Alert variant="info" className="flex items-center gap-2 py-2 bg-blue-50">
                    <ShieldCheck className="h-4 w-4 text-blue-800" />
                    <AlertDescription className="text-xs">
                      This site is protected by hCaptcha to ensure you're not a robot.
                    </AlertDescription>
                  </Alert>
                  */}
                  
                  <Button type="submit" className="w-full">
                    Sign In with Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Enter your email below to create an account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OAuth Providers */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 h-10"
                    onClick={() => handleOAuthSignIn("google")}
                  >
                    <Chrome className="h-4 w-4" />
                    <span>Google</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 h-10"
                    onClick={() => handleOAuthSignIn("github")}
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </Button>
                </div>

                <div className="relative flex items-center justify-center my-6">
                  <Separator className="w-full" />
                  <span className="absolute bg-gray-50 text-gray-500 text-xs px-2">OR</span>
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        placeholder="name@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* hCaptcha Container - Commented out for development */}
                  {/*
                  <div className="flex justify-center my-4">
                    <div className="h-captcha" data-sitekey="YOUR_HCAPTCHA_SITE_KEY" data-theme="light"></div>
                  </div>
                  
                  <Alert variant="info" className="flex items-center gap-2 py-2 bg-blue-50">
                    <ShieldCheck className="h-4 w-4 text-blue-800" />
                    <AlertDescription className="text-xs">
                      This site is protected by hCaptcha to ensure you're not a robot.
                    </AlertDescription>
                  </Alert>
                  */}
                  
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-center">
                <p className="text-sm text-gray-500 mt-2">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
