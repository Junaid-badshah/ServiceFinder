import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchBar from "../../components/search/SearchBar";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80",
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80",
  "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=1920&q=80",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80",
];

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = ({ service, location }) => {
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (location) params.set("location", location);
    navigate(`/providers?${params.toString()}`);
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* Rotating Backgrounds */}
      {BACKGROUND_IMAGES.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === bgIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />

      <div className="relative h-full flex flex-col px-4 py-6 md:py-8">
        {/* SEARCH BAR — same component as Providers */}
        <SearchBar onSearch={handleSearch} />

        {/* CENTERED TEXT + PROVIDER BUTTON */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <span className="inline-block bg-white/10 backdrop-blur-md text-white text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full border border-white/20 tracking-wider uppercase">
            ✨ Trusted by Thousands
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl">
            Skilled Hands,
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              At Your Doorstep
            </span>
          </h1>

          <p className="text-gray-200 text-sm md:text-base lg:text-lg max-w-2xl leading-relaxed">
            From fixing pipes to building dreams — we connect you with
            <span className="text-yellow-300 font-semibold">
              {" "}
              verified professionals{" "}
            </span>
            you can trust.
          </p>

          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white tracking-wide">
            Find Your <span className="text-primary-300">Service</span> Now
          </h2>

          <button
            onClick={() => navigate("/providers")}
            className="group bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-8 py-3.5 md:px-10 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-2xl transition-all hover:scale-105 flex items-center gap-3 mt-2"
          >
            <span className="text-xl md:text-2xl">🔧</span>
            Providers
            <span className="text-xl md:text-2xl group-hover:translate-x-2 transition-transform">
              →
            </span>
          </button>

          <p className="text-gray-300 text-xs md:text-sm opacity-90">
            Join 500+ professionals already working with us
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
