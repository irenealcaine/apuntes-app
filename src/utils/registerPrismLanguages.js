import { Prism } from "prism-react-renderer"

function getPlaceholder(language, index) {
  return "___" + language.toUpperCase() + index + "___"
}

Object.defineProperties((Prism.languages["markup-templating"] = {}), {
  buildPlaceholders: {
    value: function (env, language, placeholderPattern, replaceFilter) {
      if (env.language !== language) return
      var tokenStack = (env.tokenStack = [])
      env.code = env.code.replace(placeholderPattern, function (match) {
        if (typeof replaceFilter === "function" && !replaceFilter(match)) return match
        var i = tokenStack.length
        var placeholder
        while (env.code.indexOf((placeholder = getPlaceholder(language, i))) !== -1) ++i
        tokenStack[i] = match
        return placeholder
      })
      env.grammar = Prism.languages.markup
    },
  },
  tokenizePlaceholders: {
    value: function (env, language) {
      if (env.language !== language || !env.tokenStack) return
      env.grammar = Prism.languages[language]
      var j = 0
      var keys = Object.keys(env.tokenStack)
      function walkTokens(tokens) {
        for (var i = 0; i < tokens.length; i++) {
          if (j >= keys.length) break
          var token = tokens[i]
          if (typeof token === "string" || (token.content && typeof token.content === "string")) {
            var k = keys[j]
            var t = env.tokenStack[k]
            var s = typeof token === "string" ? token : token.content
            var placeholder = getPlaceholder(language, k)
            var index = s.indexOf(placeholder)
            if (index > -1) {
              ++j
              var before = s.substring(0, index)
              var middle = new Prism.Token(
                language,
                Prism.tokenize(t, env.grammar),
                "language-" + language,
                t,
              )
              var after = s.substring(index + placeholder.length)
              var replacement = []
              if (before) replacement.push.apply(replacement, walkTokens([before]))
              replacement.push(middle)
              if (after) replacement.push.apply(replacement, walkTokens([after]))
              if (typeof token === "string") {
                tokens.splice.apply(tokens, [i, 1].concat(replacement))
              } else {
                token.content = replacement
              }
            }
          } else if (token.content) {
            walkTokens(token.content)
          }
        }
        return tokens
      }
      walkTokens(env.tokens)
    },
  },
})

Prism.languages.django = {
  comment: /^\{#[\s\S]*?#\}$/,
  tag: {
    pattern: /(^\{%[+-]?\s*)\w+/,
    lookbehind: true,
    alias: "keyword",
  },
  delimiter: {
    pattern: /^\{[{%][+-]?|[+-]?[}%]\}$/,
    alias: "punctuation",
  },
  string: {
    pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
    greedy: true,
  },
  filter: {
    pattern: /(\|)\w+/,
    lookbehind: true,
    alias: "function",
  },
  test: {
    pattern: /(\bis\s+(?:not\s+)?)(?!not\b)\w+/,
    lookbehind: true,
    alias: "function",
  },
  function: /\b[a-z_]\w+(?=\s*\()/i,
  keyword: /\b(?:and|as|by|else|for|if|import|in|is|loop|not|or|recursive|with|without)\b/,
  operator: /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  number: /\b\d+(?:\.\d+)?\b/,
  boolean: /[Ff]alse|[Nn]one|[Tt]rue/,
  variable: /\b\w+\b/,
  punctuation: /[{}[\](),.:;]/,
}

var pattern = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g
var markupTemplating = Prism.languages["markup-templating"]

Prism.hooks.add("before-tokenize", function (env) {
  markupTemplating.buildPlaceholders(env, "django", pattern)
})
Prism.hooks.add("after-tokenize", function (env) {
  markupTemplating.tokenizePlaceholders(env, "django")
})

Prism.languages.jinja2 = Prism.languages.django
Prism.hooks.add("before-tokenize", function (env) {
  markupTemplating.buildPlaceholders(env, "jinja2", pattern)
})
Prism.hooks.add("after-tokenize", function (env) {
  markupTemplating.tokenizePlaceholders(env, "jinja2")
})

Prism.languages.jinja = Prism.languages.django
Prism.hooks.add("before-tokenize", function (env) {
  markupTemplating.buildPlaceholders(env, "jinja", pattern)
})
Prism.hooks.add("after-tokenize", function (env) {
  markupTemplating.tokenizePlaceholders(env, "jinja")
})

Prism.languages.java = Prism.languages.extend("clike", {
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^"\\\r\n])*"/,
    lookbehind: true,
    greedy: true,
  },
  "class-name": [
    {
      pattern: /(\b(?:class|enum|extends|implements|instanceof|interface|new|record|throws)\s+)[A-Z]\w*(?:\s*\.\s*[A-Z]\w*)*/,
      lookbehind: true,
    },
    {
      pattern: /(^|[^\w.])(?:[A-Z]\w*(?:\s*\.\s*[A-Z]\w*)*\.)*[A-Z]\w*(?=\s+\w+\s*[;,=()]|\s*(?:\[[\s,]*\]\s*)?::\s*new\b)/,
      lookbehind: true,
    },
    {
      pattern: /(^|[^\w.])[A-Z]\w+(?=\s*\.\s*[a-z]\w*)/,
      lookbehind: true,
    },
  ],
  keyword: /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|non-sealed|null|open|opens|package|permits|private|protected|provides|public|record(?!\s*[(){}[\]<>=%~.:,;?+\-*/&|^])|requires|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/,
  function: [
    Prism.languages.clike.function,
    {
      pattern: /(::\s*)[a-z_]\w*/,
      lookbehind: true,
    },
  ],
  number: /\b0b[01][01_]*L?\b|\b0x(?:\.[\da-f_p+-]+|[\da-f_]+(?:\.[\da-f_p+-]+)?)\b|(?:\b\d[\d_]*(?:\.[\d_]*)?|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
  operator: {
    pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
    lookbehind: true,
  },
  constant: /\b[A-Z][A-Z_\d]+\b/,
})

Prism.languages.insertBefore("java", "string", {
  "triple-quoted-string": {
    pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
    greedy: true,
    alias: "string",
  },
  char: {
    pattern: /'(?:\\.|[^'\\\r\n]){1,6}'/,
    greedy: true,
  },
})

Prism.languages.insertBefore("java", "class-name", {
  annotation: {
    pattern: /(^|[^.])@\w+(?:\s*\.\s*\w+)*/,
    lookbehind: true,
    alias: "punctuation",
  },
  generics: {
    pattern: /<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&)|<(?:[\w\s,.?]|&(?!&))*>)*>)*>)*>/,
    inside: {
      "class-name": /[A-Z]\w*/,
      keyword: /\b(?:extends|super)\b/,
      punctuation: /[<>(),.:]/,
      operator: /[?&|]/,
    },
  },
  import: [
    {
      pattern: /(\bimport\s+)(?:[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.\s*)?)*(?:[A-Z]\w*|\*)(?=\s*;)/,
      lookbehind: true,
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: { punctuation: /\./ },
        },
        punctuation: /\./,
        operator: /\*/,
        "class-name": /\w+/,
      },
    },
    {
      pattern: /(\bimport\s+static\s+)(?:[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.\s*)?)*(?:\w+|\*)(?=\s*;)/,
      lookbehind: true,
      alias: "static",
      inside: {
        namespace: {
          pattern: /^[a-z]\w*(?:\s*\.\s*[a-z]\w*)*(?:\s*\.)?/,
          inside: { punctuation: /\./ },
        },
        static: /\b\w+$/,
        punctuation: /\./,
        operator: /\*/,
        "class-name": /\w+/,
      },
    },
  ],
  namespace: {
    pattern: /(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)[a-z]\w*(?:\.[a-z]\w*)*\.?/,
    lookbehind: true,
    inside: { punctuation: /\./ },
  },
})

Prism.languages.velocity = Prism.languages.extend("markup", {})

var velocity = {
  variable: {
    pattern: /(^|[^\\](?:\\\\)*)\$!?(?:[a-z][\w-]*(?:\([^)]*\))?(?:\.[a-z][\w-]*(?:\([^)]*\))?|\[[^\]]+\])*|\{[^}]+\})/i,
    lookbehind: true,
    inside: {},
  },
  string: {
    pattern: /"[^"]*"|'[^']*'/,
    greedy: true,
  },
  number: /\b\d+\b/,
  boolean: /\b(?:false|true)\b/,
  operator: /[=!<>]=?|[+*/%-]|&&|\|\||\.\.|\b(?:eq|g[et]|l[et]|n(?:e|ot))\b/,
  punctuation: /[(){}[\]:,.]/,
}

velocity.variable.inside = {
  string: velocity.string,
  function: {
    pattern: /([^\w-])[a-z][\w-]*(?=\()/,
    lookbehind: true,
  },
  number: velocity.number,
  boolean: velocity.boolean,
  punctuation: velocity.punctuation,
}

Prism.languages.insertBefore("velocity", "comment", {
  unparsed: {
    pattern: /(^|[^\\])#\[\[[\s\S]*?\]\]#/,
    lookbehind: true,
    greedy: true,
    inside: { punctuation: /^#\[\[|\]\]#$/ },
  },
  "velocity-comment": [
    {
      pattern: /(^|[^\\])#\*[\s\S]*?\*#/,
      lookbehind: true,
      greedy: true,
      alias: "comment",
    },
    {
      pattern: /(^|[^\\])##.*/,
      lookbehind: true,
      greedy: true,
      alias: "comment",
    },
  ],
  directive: {
    pattern: /(^|[^\\](?:\\\\)*)#@?(?:[a-z][\w-]*|\{[a-z][\w-]*\})(?:\s*\((?:[^()]|\([^()]*\))*\))?/i,
    lookbehind: true,
    inside: {
      keyword: {
        pattern: /^#@?(?:[a-z][\w-]*|\{[a-z][\w-]*\})|\bin\b/,
        inside: { punctuation: /[{}]/ },
      },
      rest: velocity,
    },
  },
  variable: velocity.variable,
})

Prism.languages.velocity["tag"].inside["attr-value"].inside.rest = Prism.languages.velocity
