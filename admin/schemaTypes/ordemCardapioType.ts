import {defineField, defineType} from 'sanity'

// Documento técnico editado pela tela Organizar cardápio, não por um formulário.
// As listas de IDs permitem reordenar sem modificar ou republicar os produtos.
// IDs de itens excluídos são ignorados pelo site e removidos no próximo salvamento.
export const ordemCardapioType = defineType({
  name: 'ordemCardapio',
  title: 'Ordem do cardápio',
  type: 'document',
  fields: [
    defineField({name: 'categorias', title: 'Categorias', type: 'array', of: [{type: 'string'}], readOnly: true}),
    defineField({name: 'produtos', title: 'Produtos', type: 'array', of: [{type: 'string'}], readOnly: true}),
  ],
})
