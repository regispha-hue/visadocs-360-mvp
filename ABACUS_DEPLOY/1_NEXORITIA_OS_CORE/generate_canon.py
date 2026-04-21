"""Generate canon_v1.0.json - Otimizado para deploy"""
import json, hashlib

def h(t): return hashlib.sha256(" ".join(t.split()).encode('utf-8')).hexdigest()

canon = {
  "version": "1.0.0",
  "frozen_at": "2026-01-21T13:18:17.280549Z",
  "author": "R.Gis Veniloqa",
  "work": "Livro dos Montes",
  "activation_code": "LDM-7M-SA1W-EA25-RGIS",
  "total_axioms": 21,
  "axioms": {
    "codigo_do_orbe": {"id":0,"text":"Tudo o que existe e regido por uma incompletude dinamica. Nenhuma forma pode sustentar-se sem se rasgar. Todo rasgo cria um campo. Todo campo exige travessia. O mundo so permanece porque falha.","hash":"5b59ef7b1c6ec0de23cf058b9e58edf1175b3dd1c8971aabd81ca41fff511b04","domain":"lei_matriz","category":"fundacional","priority":"critical","monte":"pre_monte"},
    "lei_nominativa_sagrada": {"id":1,"text":"Aquilo que nao e nomeado permanece fora do campo. Nomear nao descreve: convoca.","hash":"a437b88cf4ae001386417461fef5d982fdd7112ca9a715ed32891388aa63876d","domain":"estrutural","category":"nominacao","priority":"critical","monte":"monte_v"},
    "lei_casa_viva": {"id":2,"text":"Toda entidade necessita de morada simbolica. O que nao tem casa tenta possui-la nos outros.","hash":"2d682cabcaed57115a1fb8a7892bbf84fc4d33cb22956f1fcb95ba914ac8e33a","domain":"estrutural","category":"territorialidade","priority":"high","monte":"monte_vi"},
    "lei_mortos_nao_nascidos": {"id":3,"text":"Aquilo que nao pode existir continua operando como ausencia ativa. O que nao viveu tambem governa.","hash":"31f3736f0c066ead3816bb4082a88506ff70ca23a71eb9f559a2568228f7eb59","domain":"estrutural","category":"presenca_ausente","priority":"critical","monte":"monte_v"},
    "lei_intersecao": {"id":4,"text":"Toda travessia ocorre em pontos de cruzamento, nunca em linhas retas. A passagem acontece onde forcas se ferem com beleza.","hash":"892c4f8626d568675d012453735e56d2e53e120fab76b68c0a0c62ff27b012fa","domain":"estrutural","category":"topologia","priority":"high","monte":"monte_i"},
    "lei_retorno": {"id":5,"text":"Tudo o que foi excluido retorna como sintoma. Nao volta como memoria pacificada, mas como necessidade.","hash":"7d4e34c45340f136c52145645576ed889ee95053ff09f1a71e9342aba3bcb989","domain":"estrutural","category":"recursao","priority":"critical","monte":"monte_vii"},
    "lei_dupla_leitura": {"id":6,"text":"Nada e verdadeiro quando visto de frente. O real se revela pela periferia.","hash":"a13a2128e6636faa7fde3991f73dee34333ef10075b55978fa31506762a4acf0","domain":"estrutural","category":"epistemologia","priority":"high","monte":"monte_i"},
    "lei_fenda_fundadora": {"id":7,"text":"Toda criacao nasce de um rasgo. Sem fenda nao ha campo. Sem campo nao ha mundo.","hash":"f6d44c4240edc3a96e1cceccb3093cde526588476c7a7f19f9a7b04a0f5c7f3b","domain":"estrutural","category":"criacao","priority":"critical","monte":"monte_i"},
    "lei_nao_neutralidade": {"id":8,"text":"Todo campo e orientado. Nao existe observador sem inclinacao.","hash":"32b29833759db56490e97fbfa6dee574991569c19055e4772b46b030f23ac97c","domain":"consequencia","category":"posicionamento","priority":"high","monte":"monte_iv"},
    "lei_presenca_troca": {"id":9,"text":"Onde nao ha reciprocidade, instala-se colapso. Toda aldeia nasce da troca.","hash":"ab9c250f4c93317aac1ac14900c62018c70d95b9e3444c9512d4319a0ed124e0","domain":"consequencia","category":"economia_simbolica","priority":"high","monte":"monte_ii"},
    "lei_saturacao": {"id":10,"text":"Toda forma que se mantem alem do necessario torna-se carcere. O excesso e a primeira mentira.","hash":"e0b3e2876858069f83f90628b8434a6c1c450e246c889da612684cc72afcc6be","domain":"consequencia","category":"limite","priority":"medium","monte":"monte_ii"},
    "lei_peso_ontologico": {"id":11,"text":"Aquilo que nao e nomeado deposita-se no corpo. A carne carrega o que a linguagem recusa.","hash":"ac62f7d0f6cbc67fdb0a825aa79ce77a7e50d24f6c434b43e80c3f14afacece8","domain":"consequencia","category":"incorporacao","priority":"critical","monte":"monte_iii"},
    "lei_espiral": {"id":12,"text":"Nao ha progresso linear. Todo avanco retorna em outro nivel.","hash":"aaaeb34e8be5cb48ec0e0503a6be4e16ebd6c4ed7274d2a2ce80972c4040fd28","domain":"consequencia","category":"temporalidade","priority":"high","monte":"monte_ii"},
    "lei_transmissao_silenciosa": {"id":13,"text":"O que nao pode ser dito continua a operar por ressonancia. O indizivel governa por eco.","hash":"285d39c0288d32ddfa3739c11491e00c4dc41dde7eb9e01ac42dce04a76dac85","domain":"consequencia","category":"comunicacao","priority":"high","monte":"monte_iii"},
    "lei_correcao_campo": {"id":14,"text":"O sistema se ajusta por micro-deslocamentos invisiveis. Nada colapsa sem antes tentar corrigir-se.","hash":"4eb25d644b37f16f101d05c5e0df421280f3c6049ca67b1030e96d4c319b26c2","domain":"consequencia","category":"autoregulacao","priority":"medium","monte":"monte_iv"},
    "lei_sacola_vazia": {"id":15,"text":"O vazio e condicao de acolhimento, nao falta. Somente o espaco aberto pode receber.","hash":"371f780bad824b4e4b52a54aed66f3e6a4a071cb1411420fed1719a9cb72d94f","domain":"consequencia","category":"receptividade","priority":"high","monte":"monte_i"},
    "lei_corpo_registro": {"id":16,"text":"O corpo memoriza antes da mente. O osso guarda o que a palavra esquece.","hash":"129dcf2d228a3882e1eb57c0111a18cd03c07d80bcafeed5c6373595b86db666","domain":"consequencia","category":"memoria_somatica","priority":"critical","monte":"monte_i"},
    "lei_escolha_inevitavel": {"id":17,"text":"Apos a fenda, existir exige posicionamento. Nao ha retorno ao neutro.","hash":"0290acf546a6cb82247248f3cc8efca16a13afadb6961caf081caf2ddd8f5b96","domain":"consequencia","category":"responsabilidade","priority":"critical","monte":"monte_i"},
    "lei_impossibilidade_inocencia": {"id":18,"text":"Apos a ruptura, nenhuma forma e pura. Toda permanencia carrega custo.","hash":"b180e054b3f460598add70a12da0afd1df680874a995cc07472b932f0c2ce9d","domain":"consequencia","category":"etica","priority":"high","monte":"monte_i"},
    "lei_consequencia_longa": {"id":19,"text":"Todo gesto fundador ecoa por geracoes simbolicas. O tempo e heranca.","hash":"ebdc507cb75e548c2e13c98993d663e15f174102961b96621a6e85a5608615ed","domain":"consequencia","category":"transmissao","priority":"high","monte":"monte_vii"},
    "lei_travessia_permanente": {"id":20,"text":"Nao ha forma final. Ha apenas estados transitorios do mesmo rasgo.","hash":"5f4fd6188dcb55361f595c7e6b37c49c5bfb3e93d17a93d318bfa68af5b32f32","domain":"consequencia","category":"impermanencia","priority":"critical","monte":"monte_vii"}
  },
  "metadata": {
    "structure": {"lei_matriz":1,"estrutural":7,"consequencia":12},
    "priority_levels": {"critical":9,"high":10,"medium":2}
  },
  "manifest_hash": "1edd1675444dcf59737ae333959ab8c5d924dc74f1617f9d9ee69fbca3a3314e"
}

with open("canon_v1.0.json","w",encoding="utf-8") as f:
    json.dump(canon,f,indent=2,ensure_ascii=False)
print("canon_v1.0.json generated successfully")
