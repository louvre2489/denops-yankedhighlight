# denops-yankedhighlight
Highlight the yanked area.(Inspired by [machakann/vim-highlightedyank)](https://github.com/machakann/vim-highlightedyank))

## Requirements
This requires [Deno](https://deno.land) and [denops.vim](https://github.com/vim-denops/denops.vim).

## Usage
There is no need for configuration, as the highlight event is automatically triggered by the TextYankPost event.

### Highlight Duration
Set highlight duration(ms).
```vim
" Default
let g:yankedhighlight_duration = 1000
```

### Highlight Background Color
Set highlight background color.
```vim
" Default
let g:yankedhighlight_bg_color= 220
```

### Highlight Foreground Color
Set highlight foreground color.
```vim
" Default
let g:yankedhighlight_fg_color= 16
```


