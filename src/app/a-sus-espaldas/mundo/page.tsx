import { redirect } from 'next/navigation';

/** El mundo en 3D ya no existe: el paseo en 2D es la pantalla principal. */
export default function Page(): never {
  redirect('/a-sus-espaldas/paseo');
}
