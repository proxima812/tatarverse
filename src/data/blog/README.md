# Публикации блога

Добавлять отдельные `.md` / `.mdx` файлы с frontmatter:

```yaml
title: Заголовок
description: Короткое описание
format: guide # post | article | guide
category: communities # communities | language | culture | history
locale: ru # ru | en
pubDate: 2026-11-17
author: Имя автора
draft: true
# updatedDate: 2026-11-18
# cover: /images/blog/cover.jpg
```

`README.md` исключён из загрузчика. Путь файла без расширения становится адресом `/blog/<id>/` (для английских материалов — `/en/blog/<id>/`). Не использовать один id для разных языков. Черновики и материалы с будущей датой не публикуются.

Перед публикацией применять Humanizer и russian-humanize по правилам в `CLAUDE.md`. Проверять источники; не добавлять вымышленные публикации для заполнения интерфейса.
