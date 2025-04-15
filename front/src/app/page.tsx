import Head from "next/head";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#2C0EEB" />

        {/* Mobile Friendly */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />

        <title>Interno Rotas 🚌</title>
        <meta
          name="description"
          content="Veja rotas e horários das linhas de ônibus internas do Campus Pampulha da UFMG"
        />
        <link rel="icon" href="/favicon.png" />

        {/* Meta tags para redes sociais */}
        <meta property="og:title" content="Interno Rotas 🚌" />
        <meta
          property="og:description"
          content="Veja rotas e horários das linhas de ônibus internas do Campus Pampulha da UFMG"
        />
        <meta property="og:url" content="https://internorotas.github.io/ufmg/" />
        <meta
          property="og:image"
          content="https://raw.githubusercontent.com/internorotas/ufmg/main/github/logo_Capa.svg"
        />
        <meta property="og:site_name" content="Interno Rotas 🚌" />
        <meta property="og:type" content="website" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Interno Rotas 🚌" />
        <meta
          property="twitter:description"
          content="Veja rotas e horários das linhas de ônibus internas do Campus Pampulha da UFMG"
        />
        <meta
          property="twitter:image"
          content="https://raw.githubusercontent.com/internorotas/ufmg/main/github/logo_Capa.svg"
        />

        {/* Estilos e fontes */}
        <link rel="stylesheet" href="/styles/style.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />

        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
          integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
          crossOrigin="anonymous"
        />
      </Head>
      <main>
        <div id="mapa"></div>

        <div id="header-mobile">
          <header>
            <Image
              src="/logo-horizontal-transparente.svg"
              alt="Logo Interno Rotas"
              width={200}
              height={50}
            />
          </header>
          <section id="header-menu-mobile">
            <button id="fechar-linhas-horarios" aria-label="Fechar Linhas e Horários">
              <div>
                <p>voltar ao mapa</p>
                <Image src="/close-icon.svg" alt="Ícone de fechar" width={20} height={20} />
              </div>
            </button>
          </section>
        </div>

        <div id="botao-mobile">
          <button id="ver-linhas-horarios" aria-label="Ver Linhas e Horários">
            <div>
              <p>ver rotas e horários</p>
              <Image src="/arrow-icon.svg" alt="Seta para direita" width={20} height={20} />
            </div>
          </button>
        </div>

        <div id="menu-lateral">
          <header>
            <Image
              src="/logo-horizontal-transparente.svg"
              alt="Logo Interno Rotas"
              width={200}
              height={50}
            />
          </header>

          <main>
            <section className="dia-itinerario">
              <p>Dias Úteis</p>
              <p>
                <strong>UFMG</strong>
              </p>
            </section>

            <section id="container-linhas-dias-uteis"></section>

            <section className="dia-itinerario">
              <p>Linha Sábado</p>
            </section>
            <section id="container-linhas-sabado"></section>

            <section className="dia-itinerario">
              <p>Linha Férias e Recessos</p>
            </section>
            <section id="container-linhas-ferias-recessos"></section>

            <section className="aviso">
              <p>
                Informações extraídas do{" "}
                <a href="https://ufmg.br/servicos/onibus" target="_blank">
                  site da UFMG
                </a>
                .
              </p>
              <p>
                Podem haver mudanças de itinerário e horários sem prévio aviso. Para informações,
                reclamações, dúvidas e sugestões, entre em contato com a{" "}
                <strong>Divisão de Transportes</strong>.
              </p>
              <p>
                Telefones: <a href="tel:03134094601">3409–4601</a> ou{" "}
                <a href="tel:03134094606">3409–4606</a>
              </p>
              <p>
                E-mail: <a href="mailto:sfrota@dsg.ufmg.br">sfrota@dsg.ufmg.br</a>
              </p>
            </section>

            <footer>
              <section id="reportar-problema">
                <button>Encontrou algum problema?</button>
                <div id="container-problema-links" className="escondido">
                  <p>
                    Por gentileza, envie um email para{" "}
                    <a href="mailto:igor44@ufmg.br">igor44@ufmg.br</a> ou me chame no{" "}
                    <a href="https://www.instagram.com/titan.css/" target="_blank">
                      Instagram
                    </a>{" "}
                    descrevendo o problema que irei corrigir o mais rápido possível!
                  </p>
                </div>
              </section>
              <a id="sobre-projeto" href="https://github.com/internorotas/ufmg" target="_blank">
                Sobre o Projeto{" "}
                <Image src="/external-link.svg" alt="Link Externo" width={16} height={16} />
              </a>

              <a id="creditos" href="https://github.com/igormartins4" target="_blank">
                Desenvolvido com 💙 por Igor Martins
              </a>
            </footer>
          </main>
        </div>
      </main>
    </>
  );
}
