'use client';

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SupportPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % successStories.length);
    }, 5000); // Change testimonial every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const dependencies = [
    {
      name: 'Next.js',
      website: 'https://nextjs.org',
      license: 'MIT',
      mandatory: true,
      description: 'React framework for production'
    },
    {
      name: 'React',
      website: 'https://react.dev',
      license: 'MIT',
      mandatory: true,
      description: 'Frontend library for building user interfaces'
    },
    {
      name: 'Tailwind CSS',
      website: 'https://tailwindcss.com',
      license: 'MIT',
      mandatory: true,
      description: 'Utility-first CSS framework'
    },
    {
      name: 'Mapbox GL',
      website: 'https://www.mapbox.com',
      license: 'Custom',
      mandatory: true,
      description: 'Maps and location features'
    },
    {
      name: 'Supabase',
      website: 'https://supabase.com',
      license: 'Apache 2.0',
      mandatory: true,
      description: 'Open source Firebase alternative'
    },
    {
      name: 'Python',
      website: 'https://python.org',
      license: 'PSF License',
      mandatory: true,
      description: 'Backend programming language'
    },
    {
      name: 'Groq',
      website: 'https://groq.com',
      license: 'Custom',
      mandatory: true,
      description: 'AI model and inference engine'
    }
  ];

  const successStories = [
    {
      title: 'Vivek\'s Story',
      content: 'The mood-based recommendations are spot on! I love how it suggests exactly what I\'m craving based on my music. As a regular customer, this has completely changed how I order food.',
      image: '/t1.png'
    },
    {
      title: 'Namit\'s Experience',
      content: 'Finding surplus deals has helped me try amazing restaurants while saving money. It\'s a win-win situation! The recommendations always match my mood perfectly.',
      image: '/t2.png'
    },
    {
      title: 'Janam\'s Restaurant',
      content: 'As a restaurant owner, this platform has helped us reduce waste significantly while reaching new customers. The mood-based matching brings us customers who truly enjoy our food.',
      image: '/t3.png'
    },
    {
      title: 'Pranshav\'s Journey',
      content: 'The combination of music and food recommendations creates a unique dining experience every time! Plus, the surplus deals help reduce food waste while saving money.',
      image: '/t4.png'
    }
  ];

  const partners = [
    {
      name: 'Lorem Tech Solutions',
      role: 'Technology Partner',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      name: 'Ipsum Innovations',
      role: 'Research Partner',
      description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
    },
    {
      name: 'Dolor Analytics',
      role: 'Data Partner',
      description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Support Center</h1>

      {/* Help Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Getting Help</h2>
        <Card className="p-6">
          <h3 className="text-xl font-medium mb-4">How to Get Support</h3>
          <ul className="space-y-4">
            <li>
              <strong>Documentation:</strong>{' '}
              <a 
                href="https://github.com/pranshavpatel/CSC510-Section2-Group8/blob/main/README.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View our documentation
              </a>
            </li>
            <li>
              <strong>Community:</strong>{' '}
              <a 
                href="https://discord.gg/mood2food" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Join our Discord community
              </a>
            </li>
          </ul>
        </Card>
      </section>

      {/* How to Use Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">How to Use Mood2Food</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">1</div>
              <div>
                <h3 className="font-medium">Connect Music App</h3>
                <p className="text-sm text-muted-foreground">Sign in and connect your music app to analyze your current mood</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">2</div>
              <div>
                <h3 className="font-medium">Get Recommendations</h3>
                <p className="text-sm text-muted-foreground">Receive personalized food recommendations based on your mood</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">3</div>
              <div>
                <h3 className="font-medium">Browse Surplus</h3>
                <p className="text-sm text-muted-foreground">Alternatively, check available surplus deals from local restaurants</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">4</div>
              <div>
                <h3 className="font-medium">Place Order</h3>
                <p className="text-sm text-muted-foreground">Select your food, customize if needed, and place your order</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">5</div>
              <div>
                <h3 className="font-medium">Restaurant Dashboard</h3>
                <p className="text-sm text-muted-foreground">Restaurant owners can manage orders and surplus items through their dashboard</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Dependencies Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Third-Party Dependencies</h2>
        <div className="grid gap-4">
          {dependencies.map((dep, index) => (
            <Card key={index} className="p-4">
              <h3 className="text-lg font-medium">{dep.name}</h3>
              <p className="text-sm text-gray-600">
                <a href={dep.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {dep.website}
                </a>
              </p>
              <p className="text-sm">License: {dep.license}</p>
              <p className="text-sm">Status: {dep.mandatory ? 'Mandatory' : 'Optional'}</p>
              <p className="text-sm text-gray-600">{dep.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
        <div className="relative">
          <Card className="p-6 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={successStories[activeIndex].image}
                  alt={`${successStories[activeIndex].title} testimonial`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="flex-1">
                <p className="text-lg mb-4 italic">"{successStories[activeIndex].content}"</p>
                <h3 className="font-medium text-xl">{successStories[activeIndex].title}</h3>
              </div>
            </div>
            <div className="flex justify-center mt-6 gap-2">
              {successStories.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Partners Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Partners</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-xl font-medium mb-2">{partner.name}</h3>
              <p className="text-sm font-medium text-gray-600 mb-2">{partner.role}</p>
              <p className="text-sm text-gray-600">{partner.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}