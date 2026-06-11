export default function Home() {
  const sections = [
    { id: 'top', name: 'Home', color: 'bg-blue-50' },
    { id: 'services', name: 'Services', color: 'bg-green-50' },
    { id: 'projects', name: 'Projects', color: 'bg-indigo-50' },
    { id: 'stats', name: 'About / Stats', color: 'bg-purple-50' },
    { id: 'contact', name: 'Contact', color: 'bg-amber-50' },
  ];

  return (
    <>
      {/* Hero Section Placeholder */}
      <section id="top" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mepm-eyebrow mb-6">BUILDING SERVICES CONSULTANTS</div>
          <h1 className="mepm-display mb-6 text-navy-700">
            Engineering buildings that <span className="text-mepm-green">perform</span>.
          </h1>
          <p className="mepm-lead mb-12 max-w-2xl mx-auto">
            Multi-disciplinary electrical, mechanical and environmental engineering — innovative design and efficient, sustainable systems tailored to your project.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn btn-primary">Get a quote</button>
            <button className="btn btn-ghost">View our work</button>
          </div>
        </div>
      </section>

      {/* Services Section Placeholder */}
      <section id="services" className="py-24 bg-bg-subtle">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mepm-eyebrow mb-4">WHAT WE DO</div>
            <h2 className="mepm-h2 mb-6">Our core disciplines</h2>
            <p className="mepm-lead max-w-2xl mx-auto">
              Electrical, mechanical and environmental engineering services for projects of every scale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Electrical Engineering', 'Mechanical Engineering', 'Environmental Consultancy', 'Energy & Net Zero', 'BIM & Coordination', 'Commissioning'].map((service) => (
              <div key={service} className="card-accent p-8">
                <h3 className="mepm-h4 mb-3">{service}</h3>
                <p className="mepm-body text-fg-muted">Professional engineering services tailored to your project requirements.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section Placeholder */}
      <section id="projects" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mepm-eyebrow mb-4">SELECTED WORK</div>
            <h2 className="mepm-h2 mb-6">Case studies & projects</h2>
            <p className="mepm-lead max-w-2xl mx-auto">
              Delivering innovative engineering solutions across commercial, residential and institutional sectors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Project One', 'Project Two', 'Project Three'].map((project) => (
              <div key={project} className="card">
                <div className="bg-slate-100 h-48 rounded-md mb-4 flex items-center justify-center">
                  <span className="text-slate-400">Project image</span>
                </div>
                <h3 className="mepm-h4 mb-2">{project}</h3>
                <p className="mepm-small">Brief project description and key achievements.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section Placeholder */}
      <section id="stats" className="py-24 bg-navy-700 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Years in business', value: '15+' },
              { label: 'Projects completed', value: '200+' },
              { label: 'Team members', value: '45' },
              { label: 'Carbon saved', value: '50kt CO₂e' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="mepm-spec text-white/72">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section Placeholder */}
      <section id="contact" className="py-24 bg-bg-subtle">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="mepm-eyebrow mb-4">GET IN TOUCH</div>
            <h2 className="mepm-h2 mb-6">Start a project</h2>
            <p className="mepm-lead">
              Tell us about your next project and let's talk about how we can help.
            </p>
          </div>
          <form className="card-accent p-8 space-y-6">
            <div>
              <label className="block mepm-body font-medium mb-2">Name</label>
              <input type="text" className="input" placeholder="Your name" />
            </div>
            <div>
              <label className="block mepm-body font-medium mb-2">Email</label>
              <input type="email" className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block mepm-body font-medium mb-2">Project type</label>
              <select className="select">
                <option>Select a service</option>
                <option>Electrical Engineering</option>
                <option>Mechanical Engineering</option>
                <option>Environmental Consultancy</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Send enquiry
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
