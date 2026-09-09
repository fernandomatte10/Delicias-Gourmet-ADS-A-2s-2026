import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {OrganizarCardapio} from './components/OrganizarCardapio'
import {ordemCardapioType} from './schemaTypes/ordemCardapioType'

export default defineConfig({
  name: 'default',
  title: 'Delicias Gourmet',

  projectId: '9bplldxn',
  dataset: 'production',

  // Mantém os formulários existentes e acrescenta a tela de ordenação.
  plugins: [structureTool({
    structure: (S) => S.list().title('Cardápio').items([
      S.listItem().id('organizar-cardapio').title('Organizar cardápio')
        .child(S.component().id('organizar-cardapio').title('Organizar cardápio').component(OrganizarCardapio)),
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'ordemCardapio'),
    ]),
  }), visionTool()],

  schema: {
    types: [...schemaTypes, ordemCardapioType],
    // O documento da ordem só é criado pelo botão Salvar ordem.
    templates: (templates) => templates.filter((template) => template.schemaType !== 'ordemCardapio'),
  },
})
