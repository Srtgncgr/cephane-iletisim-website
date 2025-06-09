import Hero from './components/Hero/Hero';
import Services from './components/Services/Services';
import WhyUs from './components/WhyUs/WhyUs';
import Blog from './components/Blog/Blog';
import Contact from './components/Contact/Contact';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <Hero />
      <Services />
      <WhyUs />
      <Blog />
      <Contact />
    </main>
  );
} 