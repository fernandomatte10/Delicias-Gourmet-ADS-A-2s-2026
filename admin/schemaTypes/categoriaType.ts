// Importa as funções usadas para criar o schema e seus campos
import {defineField, defineType} from 'sanity'

// Schema responsável pelas categorias dos produtos
export const categoriaType = defineType({
  name: 'categoria',
  title: 'Categoria',
  type: 'document',

  // Campos disponíveis no cadastro de uma categoria
  fields: [
    // Nome da categoria
    defineField({
      name: 'nome',
      title: 'Nome da categoria',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
})