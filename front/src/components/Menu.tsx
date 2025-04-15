import Head from "next/head";
import Image from "next/image";






export default function Home() {
    return (
        <>





            <Head>
                {/* Mobile Friendly */}
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" href="/icon-192.png" />
            </Head>
            <main>


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
                        <button
                            id="fechar-linhas-horarios"
                            aria-label="Fechar Linhas e Horários"
                        >
                            <div>
                                <p>voltar ao mapa</p>
                                <Image
                                    src="/close-icon.svg"
                                    alt="Ícone de fechar"
                                    width={20}
                                    height={20}
                                />
                            </div>
                        </button>
                    </section>
                </div>

                <div id="botao-mobile">
                    <button id="ver-linhas-horarios" aria-label="Ver Linhas e Horários">
                        <div>
                            <p>ver rotas e horários</p>
                            <Image
                                src="/arrow-icon.svg"
                                alt="Seta para direita"
                                width={20}
                                height={20}
                            />
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
                                Podem haver mudanças de itinerário e horários sem prévio aviso.
                                Para informações, reclamações, dúvidas e sugestões, entre em
                                contato com a <strong>Divisão de Transportes</strong>.
                            </p>
                            <p>
                                Telefones: <a href="tel:03134094601">3409–4601</a> ou{" "}
                                <a href="tel:03134094606">3409–4606</a>
                            </p>
                            <p>
                                E-mail:{" "}
                                <a href="mailto:sfrota@dsg.ufmg.br">sfrota@dsg.ufmg.br</a>
                            </p>
                        </section>

                        <footer>
                            <section id="reportar-problema">
                                <button>Encontrou algum problema?</button>
                                <div id="container-problema-links" className="escondido">
                                    <p>
                                        Por gentileza, envie um email para{" "}
                                        <a href="mailto:igor44@ufmg.br">igor44@ufmg.br</a> ou me
                                        chame no{" "}
                                        <a
                                            href="https://www.instagram.com/titan.css/"
                                            target="_blank"
                                        >
                                            Instagram
                                        </a>{" "}
                                        descrevendo o problema que irei corrigir o mais rápido
                                        possível!
                                    </p>
                                </div>
                            </section>
                            <a
                                id="sobre-projeto"
                                href="https://github.com/internorotas/ufmg"
                                target="_blank"
                            >
                                Sobre o Projeto{" "}
                                <Image
                                    src="/external-link.svg"
                                    alt="Link Externo"
                                    width={16}
                                    height={16}
                                />
                            </a>

                            <a
                                id="creditos"
                                href="https://github.com/igormartins4"
                                target="_blank"
                            >
                                Desenvolvido com 💙 por Igor Martins
                            </a>
                        </footer>
                    </main>
                </div>
            </main>





        </>
    );
}