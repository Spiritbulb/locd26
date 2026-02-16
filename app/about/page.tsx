"use client";
import React from 'react';
import { Star, Heart, Crown, Sparkles, Gem, Users, Award, Globe } from 'lucide-react';

export default function About() {
  const values = [
    {
      title: "Authenticity",
      description: "We celebrate the natural beauty of textured hair and honor traditional craftsmanship in every product.",
      icon: <Crown className="w-8 h-8 text-[#8a6e5d]" />
    },
    {
      title: "Quality",
      description: "Premium ingredients and meticulous attention to detail ensure every product meets our high standards.",
      icon: <Gem className="w-8 h-8 text-[#8a6e5d]" />
    },
    {
      title: "Community",
      description: "Building connections and supporting Black artisans across Africa and the diaspora is at our core.",
      icon: <Users className="w-8 h-8 text-[#8a6e5d]" />
    },
    {
      title: "Heritage",
      description: "Every piece tells a story, connecting modern beauty with ancestral wisdom and traditions.",
      icon: <Sparkles className="w-8 h-8 text-[#8a6e5d]" />
    }
  ];

  const milestones = [
    {
      year: "2025",
      title: "The Beginning",
      description: "Founded with a vision to celebrate natural hair and African heritage through premium and affordable products."
    },
    {
      year: "2025-Future",
      title: "Community Growth",
      description: "Step into a vibrant movement that celebrates every crown, curls, coils, and locs🪮 across Africa and the diaspora. Join our bold, beautiful, and united community in educating, conserving, and uplifting natural heritage. Together, we honor the journey of textured hair, share wisdom, and build spaces where every strand tells a story of resilience, pride, and growth."
    },
    /*{
      year: "2022",
      title: "Artisan Partnerships",
      description: "Established partnerships with local artisans in Kenya, Ghana, and Nigeria."
    },
    {
      year: "2023",
      title: "Global Recognition",
      description: "Featured in major beauty publications and won the Natural Hair Excellence Award."
    },
    {
      year: "2024",
      title: "Expansion",
      description: "Launched our jewelry line and expanded to serve customers in over 15 countries."
    }*/
  ];

  const team = [
    {
      name: "Jo",
      role: "Founder & CEO",
      image: "/creator.png",
      bio: "Passionate about natural hair care and African heritage, Joan founded Loc'd Essence to bridge the gap between tradition and modern beauty."
    },
    {
      name: "Bentley Busienei",
      role: "Head of Product Development",
      image: "/bentley.jpg",
      bio: "With 15+ years in cosmetic chemistry, Bentley ensures every product meets the highest standards of quality and effectiveness."
    },
    {
      name: "Stephanie Kanji",
      role: "Jewelry Designer",
      image: "/kanji.jpg",
      bio: "A master craftsperson from Johannesburg, Stephanie brings traditional African jewelry techniques to our modern designs."
    }
  ];

  const achievements = [
    { number: "50K+", label: "Happy Customers" },
    { number: "100+", label: "Artisan Partners" },
    { number: "15", label: "Countries Served" },
    { number: "4.9", label: "Average Rating" }
  ];

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/creator.png"
            alt="Our Story"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 h-full flex items-center min-h-screen">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-3xl">
              <div className="inline-block px-4 py-2 bg-[#8a6e5d]/20 backdrop-blur-sm border border-[#8a6e5d]/30 rounded-full text-white text-sm font-medium mb-6">
                Our Story
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Where Crowns
                <br />
                <span className="text-transparent bg-gradient-to-r from-[#8a6e5d] to-[#a38776] bg-clip-text">
                  Are Celebrated
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                We're more than a beauty brand – we're a movement celebrating natural hair,
                African heritage, and the artistry that connects us all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#8a6e5d]/10 rounded-full text-[#8a6e5d] text-sm font-medium mb-4">
              Our Mission
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              Empowering Beauty, Honoring Heritage
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-6 text-lg leading-relaxed text-gray-700">
                <p>
                  At Loc'd Essence, we believe that every crown deserves to be celebrated.
                  Our mission is to provide premium hair care products and handcrafted jewelry
                  that honor the rich traditions of African beauty while meeting the needs of
                  modern consumers.
                </p>
                <p>
                  We're committed to supporting Black artisans and entrepreneurs across Africa
                  and its diaspora, creating a sustainable ecosystem that celebrates our heritage
                  while building economic opportunities for our community.
                </p>
                <p>
                  Every product we offer is carefully selected or crafted with love, ensuring
                  that when you choose Loc'd Essence, you're not just buying a product –
                  you're joining a movement that celebrates natural beauty and cultural pride.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#8a6e5d]/20 to-transparent rounded-3xl" />
              <img
                src="/creator.png"
                alt="Our Mission"
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#8a6e5d]/20 rounded-full text-[#8a6e5d] text-sm font-medium mb-4">
              Our Values
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              These core principles guide everything we do at Loc'd Essence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map(({ title, description, icon }, idx) => (
              <div key={idx} className="group bg-gray-800 rounded-2xl p-8 hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-[#8a6e5d]/30">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-[#8a6e5d]/10 rounded-2xl group-hover:bg-[#8a6e5d]/20 transition-colors">
                    {icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-300 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#8a6e5d]/10 rounded-full text-[#8a6e5d] text-sm font-medium mb-4">
              Our Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Milestones & Achievements
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From humble beginnings to global recognition
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8a6e5d] to-[#a38776] transform md:-translate-x-1/2"></div>
            <div className="space-y-12">
              {milestones.map(({ year, title, description }, idx) => (
                <div key={idx} className={`relative flex items-center ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 ml-12 md:ml-0">
                      <div className="flex items-center mb-4">
                        <span className="text-2xl font-bold text-[#8a6e5d] bg-[#8a6e5d]/10 px-4 py-2 rounded-full">
                          {year}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
                      <p className="text-gray-600 leading-relaxed">{description}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-[#8a6e5d] rounded-full transform md:-translate-x-1/2 border-4 border-white shadow-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gradient-to-r from-[#8a6e5d]/5 via-[#a38776]/5 to-[#8a6e5d]/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#8a6e5d]/10 rounded-full text-[#8a6e5d] text-sm font-medium mb-4">
              Our Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet the Visionaries
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind Loc'd Essence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map(({ name, role, image, bio }, idx) => (
              <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="relative overflow-hidden">
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
                  <p className="text-[#8a6e5d] font-semibold mb-4">{role}</p>
                  <p className="text-gray-600 leading-relaxed">{bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-[#8a6e5d]/20 rounded-full text-[#8a6e5d] text-sm font-medium mb-4">
              Impact
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Achievements
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Numbers that tell our story of growth and community impact
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {achievements.map(({ number, label }, idx) => (
              <div key={idx} className="text-center group">
                <div className="bg-gradient-to-r from-[#8a6e5d] to-[#a38776] p-8 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {number}
                  </div>
                </div>
                <p className="text-gray-300 text-lg font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-[#8a6e5d] to-[#a38776] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join Our Community
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Be part of a movement that celebrates natural beauty, honors heritage,
              and builds a stronger community together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-[#8a6e5d] rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl transform hover:-translate-y-1">
                Shop Our Collection
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-[#8a6e5d] transition-all duration-300 transform hover:-translate-y-1">
                Follow Our Journey
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}