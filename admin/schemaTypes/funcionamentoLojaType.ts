import {defineType, defineField} from 'sanity'

// Documento único, editado somente pela tela Horários e pausa.
// O painel salva diretamente esse registro; não é preciso publicar produtos.
export const funcionamentoLojaType = defineType({
  name: 'funcionamentoLoja', title: 'Funcionamento da loja', type: 'document',
  fields: [
    defineField({name: 'pausada', title: 'Pedidos pausados', type: 'boolean', readOnly: true}),
    defineField({name: 'horarios', title: 'Horários semanais', type: 'array', readOnly: true, of: [{type: 'object', fields: [
      {name: 'dia', title: 'Dia da semana', type: 'number'},
      {name: 'aberto', title: 'Atende neste dia', type: 'boolean'},
      {name: 'abertura', title: 'Abertura', type: 'string'},
      {name: 'fechamento', title: 'Fechamento', type: 'string'},
    ]}]}),
  ],
})
