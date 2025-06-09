export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// Özel kullanıcı arayüzü
export interface CustomUser {
  id: string;
  email: string;
  username: string;
  role: Role;
} 