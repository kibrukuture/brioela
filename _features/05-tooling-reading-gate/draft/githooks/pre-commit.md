# Draft: githooks/pre-commit

Target: `tools/brioela-reading-gate/githooks/pre-commit`

```shell
#!/bin/sh
# Reading gate unwired — commits are not blocked by gate:verdict.
# Run `bun run guard:check` manually when you want name/type checks.
exit 0
```
