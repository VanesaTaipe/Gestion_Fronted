export interface User {
  email: string;
  token: string;
  username: string;
  bio: string;
  image: string;
  twitter_url?: string; // Nueva propiedad opcional
  linkedin_url?: string; // Nueva propiedad opcional
}
