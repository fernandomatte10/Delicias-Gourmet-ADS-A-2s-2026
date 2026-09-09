// Importa as funções usadas para criar o schema e seus campos
import {defineField, defineType} from 'sanity'

// Schema responsável pelos produtos do Delícias Gourmet
export const produtoType = defineType({
  name: 'produto',
  title: 'Produto',
  type: 'document',

  // Campos disponíveis no cadastro de um produto
  fields: [
    // Nome do produto
    defineField({
      name: 'nome',
      title: 'Nome do produto',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    // Descrição apresentada no cardápio
    defineField({
      name: 'descricao',
      title: 'Descrição',
      type: 'text',
    }),

    // Preço de venda do produto
    defineField({
      name: 'preco',
      title: 'Preço',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),

    // Imagem exibida no cardápio
    defineField({
      name: 'imagem',
      title: 'Imagem do produto',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    // Categoria à qual o produto pertence
    defineField({
      name: 'categoria',
      title: 'Categoria',
      type: 'reference',
      to: [{type: 'categoria'}],
      validation: (Rule) => Rule.required(),
    }),

    // Define se o produto está disponível para venda
    defineField({
      name: 'disponivel',
      title: 'Produto disponível',
      type: 'boolean',
      initialValue: true,
    }),

    // Define se o produto aparecerá na área de destaques
    defineField({
      name: 'destaque',
      title: 'Produto em destaque',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})