import Link from 'next/link';
import styles from './home.module.css';

const GAMES = [
  {
    href: '/a-sus-espaldas',
    title: 'A Sus Espaldas',
    text: 'Juego por turnos. Eliges dónde está él, con quién y qué haces. Hay niveles, combos y récords.',
  },
  {
    href: '/a-sus-espaldas/paseo',
    title: 'A Sus Espaldas · El paseo',
    text: 'Caminas con el dedo por tu casa, su trabajo, el gym y el hotel. Él sigue su rutina; tú decides a quién invitar.',
  },
  {
    href: '/tres-anos',
    title: 'Tres Años',
    text: 'Historia con decisiones. Una cena de aniversario, un teléfono que vibra y lo que ella recuerda después.',
  },
] as const;

export default function Home() {
  return (
    <main className={styles.root}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Juegos de ficción</h1>
        <p className={styles.lead}>Ficción interactiva para adultos. Personajes e historias inventados. Todo se guarda solo en este navegador.</p>
        <ul className={styles.list}>
          {GAMES.map((game) => (
            <li key={game.href}>
              <Link href={game.href} className={styles.card}>
                <span className={styles.cardTitle}>{game.title}</span>
                <span className={styles.cardText}>{game.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
