import React from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, Mail } from 'lucide-react';
import '../styles/tokens.css';
import '../styles/base.css';

const UIShowcase = () => {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.style.colorScheme = newTheme;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>UI Showcase</h1>
        <Button onClick={toggleTheme} variant="secondary">Toggle Theme</Button>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Button size="small" variant="primary">Small</Button>
          <Button size="default" variant="primary">Default</Button>
          <Button size="large" variant="primary">Large</Button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="secondary" iconOnly><Search size={16} /></Button>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Inputs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px' }}>
          <Input placeholder="Default input" />
          <Input placeholder="With icon" icon={Mail} />
          <Input placeholder="Disabled input" disabled />
          <Input placeholder="Error state" error defaultValue="Wrong text" />
        </div>
      </section>
    </div>
  );
};

export default UIShowcase;
