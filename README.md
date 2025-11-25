<div align="center">

# Interno Rotas - UFMG 🚌

![Logo Interno Rotas](.github/README/branding/capa-mapa.png)

### Navegue pelo Campus Pampulha com facilidade

![GitHub repo status](https://img.shields.io/badge/status-ativo-brightgreen)
[![Contributors](https://img.shields.io/github/contributors/internorotas/ufmg)](https://github.com/internorotas/ufmg/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/internorotas/ufmg)](https://github.com/internorotas/ufmg/stargazers)
![GitHub repo size](https://img.shields.io/github/repo-size/internorotas/ufmg)
[![License](https://img.shields.io/github/license/internorotas/ufmg)](https://github.com/internorotas/ufmg/blob/main/LICENSE)

[Sobre](#-sobre) •
[Funcionalidades](#-funcionalidades) •
[Demonstração](#-demonstração) •
[Tecnologias](#-tecnologias) •
[Como Usar](#-como-usar) •
[Contribuir](#-contribuir) •
[Licença](#-licença)

</div>

---

## 📖 Sobre

O **Interno Rotas** é uma plataforma web interativa que facilita a navegação pelos ônibus internos do Campus Pampulha da UFMG. Com um mapa interativo e informações em tempo real, o projeto visa tornar o transporte universitário mais acessível e intuitivo para toda a comunidade acadêmica e visitantes.

### 🎯 Problema

O site oficial da UFMG disponibiliza informações sobre rotas e horários, mas:

- Utiliza apenas siglas de localização, dificultando a orientação
- Interface pouco intuitiva para novos usuários
- Falta de visualização geográfica clara das rotas
- Difícil identificar qual linha pega para chegar a um destino específico

### 💡 Solução

O Interno Rotas oferece:

- **Mapa interativo** com visualização clara das rotas
- **Identificação visual** de cada linha com cores únicas
- **Horários em tempo real** mostrando próximo ônibus e último que passou
- **Interface responsiva** otimizada para dispositivos móveis
- **Informações detalhadas** de cada parada e linha

## ✨ Funcionalidades

- ✅ **Mapa Interativo** - Visualização geográfica completa do Campus Pampulha
- ✅ **Rotas Animadas** - Traçado visual das linhas com animação de movimento
- ✅ **Identificação por Cores** - Cada linha possui cor única para fácil identificação
- ✅ **Horários em Tempo Real** - Veja o próximo ônibus e o último que passou
- ✅ **Detalhes das Paradas** - Informações sobre quais linhas atendem cada parada
- ✅ **Grade Completa de Horários** - Visualize todos os horários do dia de cada linha
- ✅ **Categorias de Dias** - Horários separados por dias úteis, sábados e férias/recessos
- ✅ **Design Responsivo** - Interface otimizada para desktop, tablet e celular
- ✅ **Tema Claro/Escuro** - Escolha o tema que preferir
- ✅ **Busca de Linhas** - Encontre rapidamente a linha que procura

## 🎨 Demonstração

### 🖥️ Desktop

<div align="center">

#### Tela Inicial

Interface com menu lateral mostrando todas as linhas disponíveis e mapa interativo

![Tela Inicial Desktop](.github/README/screenshots/desktop/inicial.png)

---

#### Seleção de Linha

Ao selecionar uma linha, veja a rota no mapa e os próximos horários

![Escolher Linha Desktop](.github/README/screenshots/desktop/escolher-linha.png)

---

#### Grade de Horários

Visualize todos os horários do dia com destaque para os próximos

![Horários Desktop](.github/README/screenshots/desktop/exibir-horarios.png)

</div>

### 📱 Mobile

<div align="center">

| Tela Inicial | Escolher Linha | Horários |
|:---:|:---:|:---:|
| ![Mobile Inicial](.github/README/screenshots/mobile/inicial.png) | ![Mobile Escolher Linha](.github/README/screenshots/mobile/escolher-linha.png) | ![Mobile Horários](.github/README/screenshots/mobile/exibir-horarios.png) |

*Interface totalmente responsiva e otimizada para dispositivos móveis*

</div>

## 🚀 Tecnologias

Este projeto foi desenvolvido com as seguintes tecnologias:

### Frontend

- **HTML5** - Estruturação semântica
- **CSS3** - Estilização e responsividade
- **JavaScript (ES6+)** - Lógica e interatividade

### Mapas & Visualização

- **[OpenStreetMap](https://www.openstreetmap.org/)** - Base de mapas aberta
- **[Leaflet](https://leafletjs.com/)** - Biblioteca JavaScript de mapeamento
- **[Leaflet Ant Path](https://github.com/rubenspgcavalcante/leaflet-ant-path)** - Animação das rotas

### Hospedagem

- **[GitHub Pages](https://pages.github.com/)** - Hospedagem gratuita e confiável

## 🌐 Como Usar

### Acesso Online

Acesse o projeto em produção através do link:

**🔗 [https://internorotas.github.io/ufmg/](https://internorotas.github.io/ufmg/)**

### Executar Localmente

```bash
# Clone este repositório
git clone https://github.com/internorotas/ufmg.git

# Entre na pasta do projeto
cd ufmg/app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

## 🤝 Contribuir

Contribuições são muito bem-vindas! Este é um projeto de código aberto e qualquer ajuda é apreciada.

### Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Padrão de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alteração em documentação
- `style:` - Formatação, sem mudança de código
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Tarefas de manutenção

### Ideias para Contribuir

- 🐛 Reportar bugs
- 💡 Sugerir novas funcionalidades
- 📝 Melhorar a documentação
- 🎨 Aprimorar o design
- ♿ Melhorar a acessibilidade
- 🌍 Adicionar suporte a outros idiomas
- 🎓 Adaptar para outras universidades

## 🗺️ Roadmap

- [ ] Sistema de notificações para horários favoritos
- [ ] Modo offline com PWA
- [ ] Estimativa de tempo de chegada baseado em localização
- [ ] Integração com calendário acadêmico
- [ ] API pública para desenvolvedores
- [ ] Expansão para outros campi da UFMG
- [ ] Base comunitária para outras universidades

## 📋 Design

O design do projeto foi criado no Figma e pode ser visualizado através do link:

**🎨 [Ver Design no Figma](https://www.figma.com/file/eTM6soQcsMP2vZr4d2zGus/Interno-Rotas?node-id=0%3A1&t=np3vESaYKP8h6Bn1-1)**

> **Nota:** O design final da aplicação passou por adaptações durante o desenvolvimento para melhor experiência do usuário.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

### 💙 Desenvolvido por [Igor Martins](https://github.com/igormartins44)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/igormartins44/)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/titan.css)
[![Behance](https://img.shields.io/badge/Behance-1769FF?style=for-the-badge&logo=behance&logoColor=white)](https://www.behance.net/titanstudio44)

---

⭐ Se este projeto foi útil para você, considere dar uma estrela!

</div>
