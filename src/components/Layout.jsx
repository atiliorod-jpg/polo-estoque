import NavBar from './NavBar';

export default function Layout({ title, children, actions }) {
  return (
    <div className="min-h-screen flex flex-col bg-polo-beige pb-20">
      <header className="bg-polo-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-polo-gold font-bold text-lg">🍺</span>
          <h1 className="text-base font-bold text-polo-gold tracking-wide">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <NavBar />
    </div>
  );
}
