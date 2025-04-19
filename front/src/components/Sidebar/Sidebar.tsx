import React from "react";
import Image from "next/image";

export default function Sidebar() {
  return (
    <div className="fixed top-4 left-4 h-[calc(100%-2rem)] w-[20%] bg-primary-color text-white shadow-lg z-50 rounded-lg flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-700 flex justify-center">
        <Image
          src="/logo-horizontal-transparente.svg"
          alt="Logo do Interno Rotas"
          width={150}
          height={50}
        />
      </header>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-4">
          <li>
            <a
              href="#section1"
              className="block hover:text-gray-300"
              aria-label="Ir para a seção 1"
            >
              Section 1
            </a>
          </li>
          <li>
            <a
              href="#section2"
              className="block hover:text-gray-300"
              aria-label="Ir para a seção 2"
            >
              Section 2
            </a>
          </li>
          <li>
            <a
              href="#section3"
              className="block hover:text-gray-300"
              aria-label="Ir para a seção 3"
            >
              Section 3
            </a>
          </li>
          <li>
            <a
              href="#section4"
              className="block hover:text-gray-300"
              aria-label="Ir para a seção 4"
            >
              Section 4
            </a>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-700 text-center">
        <p className="text-sm text-gray-400">
          © 2025 - Desenvolvido com 💙 por{" "}
          <a
            href="https://github.com/igormartins4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Igor Martins
          </a>
        </p>
      </footer>
    </div>
  );
}
