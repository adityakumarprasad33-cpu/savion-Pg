import { notFound } from "next/navigation";

const pages: Record<string, { title: string; content: string }> = {
  about: { 
    title: "About Us", 
    content: "Savion is revolutionizing student accommodation. We believe that finding a home near your university shouldn't be a hassle filled with brokers and fake listings. Our platform guarantees 100% verified properties and seamless bookings." 
  },
  careers: { 
    title: "Careers", 
    content: "Join our immensely talented, fast-growing team in Bangalore! We are currently looking for motivated Software Engineers, Operations Leads, and Campus Ambassadors." 
  },
  press: { 
    title: "Press & Media", 
    content: "For press inquiries, brand packages, or media relationships, please reach out to press@savion.app." 
  },
  "help-center": { 
    title: "Help Center", 
    content: "Welcome to Savion Support. If you need help with your booking, a landlord dispute, or technical issues with the App, our 24/7 support line is available via Whatsapp on your Dashboard." 
  },
  safety: { 
    title: "Safety Standards", 
    content: "Your safety is our absolute priority. Every single PG listed on Savion has passed a rigorous 24-point physical verification standard including security audits and emergency protocols." 
  },
  "cancellation-options": { 
    title: "Cancellation Options", 
    content: "We offer flexible booking arrangements. If you change your mind within 48 hours of booking an un-viewed property, we offer a 100% no-questions-asked refund of the token amount." 
  },
  "terms-of-service": { 
    title: "Terms of Service", 
    content: "These Terms of Service govern your use of the Savion App and Website. By booking a property, you enter into a binding agreement protecting both you and the property owner." 
  },
  "privacy-policy": { 
    title: "Privacy Policy", 
    content: "Savion takes data minimization seriously. We encrypt all identity documents and never share your phone number with property owners until a booking is absolutely confirmed." 
  },
  "cookie-policy": { 
    title: "Cookie Policy", 
    content: "We use essential cookies to maintain your login sessions and analytical cookies to understand how students navigate our platform to improve UI continuously." 
  },
};

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageData = pages[slug];
  
  if (!pageData) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 min-h-[60vh]">
      <div className="max-w-3xl mx-auto">
         <h1 className="text-4xl font-extrabold mb-8 text-foreground tracking-tight">{pageData.title}</h1>
         <div className="prose prose-lg text-muted-foreground">
            <p className="leading-relaxed">{pageData.content}</p>
         </div>
      </div>
    </div>
  );
}
