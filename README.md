# TinyStory

TinyStory is small indentation-based Choose Your Own Adventure engine I wrote because why not.

Syntax
------

The most important thing to note is that the nesting of text and options is achieved with indentation. For that, you must either use tabs or 4 spaces, but mustn't mix the two.

### Options
```
* I am a clickable option
    And this is the text that will be displayed if you click it
```

Note: If there are no subsequent options or jumps, the previous options will be displayed again.

### Setting Variables
```
= variable value
```

### Conditions
Check if a variable has a certain value. Not putting a value will default to `undefined`. Conditions can be nested.

```
: variable true
    * I appear only if the variable is true
: variable
    * I appear if the variable hasn't been set or is undefined
: v1 true
	: v2 true
		I appear if both v1 and v2 are true.
```

### Labels
Mark parts to jump or link to. Following blocks are nested through indentation as well.

```
[Label]
    * I'm part of the label's block!
```

### Jumps

```
* Option text
    [Label]
        We're going to jump here in a second
* Here we go
    > Label
```

Note: Putting `> End` will stop the game.

### Links
Links work pretty much the same away, except they don't erase the displayed text, so you can merge texts.

```
* Some option
    [Label]
        Things are happening here!
* And now for a link...
    As we can see:
    < Label
```

Output:
>As we can see:
>Things are happening here!

Customization
-------------

### Title
This will change the HTML title and add the title to the top of page as well:
```
# title A Cool Title
```

### Font
You can easily add a Google Font by adding:
```
# font Google Font Name
```

### Audio
You can play an audiofile by adding:
```
# audio path/to/file.ogg
```

The file should be provided in both OGG and MP3 format. You must link to the OGG file though. It will loop automatically.

### Filename
If you would like to change the name of the story file, tell TinyStory what it is in the index.html by setting
```
TinyStory.filename = "yourname.txt";
```
prior to load().

### Fade Speed
Change the fade speed by setting
```
TinyStory.fadeSpeed = 500;
```
in the index.html (value in ms).

### Restart Pause
Change the timeout duration during a restart by setting
```
TinyStory.restartPause = 500;
```
in the index.html (value in ms).


Example
-------
Finally, here's a quick example to make all of that up there a little clearer:
```
# title Example

What would you like to do?

* I want to set a variable.
    Alrighty, let's do it!
    * Set it to true
        Done.
        = var true
    * Set it to 5
        Okay.
        = var 5
        // Note that if no further options or jumps exist, the previous options are displayed again
    * Now I'd like to do something else.
        > I want to do something else.
    * Okay, that's enough.
        As you wish.
        > End
* I want to do something else.
    : var undefined
        I see you didn't set the variable.
        > End
```

Check out the `sample.txt` for a more complete example.