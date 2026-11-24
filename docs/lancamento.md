# Lançamento do Marco 1

Capturas de página inteira do Classroom Planner em 375 px (celular) e 1280 px (computador). As telas foram registradas no app local com o Supabase local e os dados fictícios do seed.

| Tela | Celular (375 px) | Computador (1280 px) |
| --- | --- | --- |
| Tela inicial deslogada | ![Tela inicial deslogada em 375 px](screenshots/lancamento/inicio-375.png) | ![Tela inicial deslogada em 1280 px](screenshots/lancamento/inicio-1280.png) |
| Login | ![Login em 375 px](screenshots/lancamento/login-375.png) | ![Login em 1280 px](screenshots/lancamento/login-1280.png) |
| Privacidade | ![Privacidade em 375 px](screenshots/lancamento/privacidade-375.png) | ![Privacidade em 1280 px](screenshots/lancamento/privacidade-1280.png) |
| Hoje | ![Hoje em 375 px](screenshots/lancamento/hoje-375.png) | ![Hoje em 1280 px](screenshots/lancamento/hoje-1280.png) |
| Alunos | ![Alunos em 375 px](screenshots/lancamento/alunos-375.png) | ![Alunos em 1280 px](screenshots/lancamento/alunos-1280.png) |
| Ficha do Aluno A | ![Ficha do Aluno A em 375 px](screenshots/lancamento/ficha-aluno-375.png) | ![Ficha do Aluno A em 1280 px](screenshots/lancamento/ficha-aluno-1280.png) |
| Agenda | ![Agenda em 375 px](screenshots/lancamento/agenda-375.png) | ![Agenda em 1280 px](screenshots/lancamento/agenda-1280.png) |
| Cobranças | ![Cobranças em 375 px](screenshots/lancamento/cobrancas-375.png) | ![Cobranças em 1280 px](screenshots/lancamento/cobrancas-1280.png) |
| Configurações | ![Configurações em 375 px](screenshots/lancamento/configuracoes-375.png) | ![Configurações em 1280 px](screenshots/lancamento/configuracoes-1280.png) |

## Como reproduzir

Com o Supabase local populado pelo seed e o app rodando em `http://localhost:3000`, execute `pnpm exec playwright install chromium` na primeira vez e depois `pnpm screenshots lancamento`. O script captura as telas públicas antes de entrar com a conta fictícia. Para recomprimir os PNGs sem perda de qualidade, execute `oxipng -o 4 -r docs/screenshots/lancamento` com o Oxipng instalado.
