<?php

require_once(dirname(__FILE__).'/JSMin.php');


// earomero _{ at }_ gmail.com
function arguments($argv) {
    $_ARG = array();
    foreach ($argv as $arg) {
        if (preg_match('#^-{1,2}([a-zA-Z0-9]*)=?(.*)$#', $arg, $matches)) {
            $key = $matches[1];
            switch ($matches[2]) {
                case '':
                case 'true':
                $arg = true;
                break;
                case 'false':
                $arg = false;
                break;
                default:
                $arg = $matches[2];
            }
            
            /* make unix like -afd == -a -f -d */            
            if(preg_match("/^-([a-zA-Z0-9]+)/", $matches[0], $match)) {
                $string = $match[1];
                for($i=0; strlen($string) > $i; $i++) {
                    $_ARG[$string[$i]] = true;
                }
            } else {
                $_ARG[$key] = $arg;    
            }            
        } else {
            $_ARG['input'][] = $arg;
        }        
    }
    return $_ARG;    
}

// file_array() by Jamon Holmgren. Exclude files by putting them in the $exclude
// string separated by pipes. Returns an array with filenames as strings.
function file_array($path, $exclude = ".|..", $recursive = false) {
    $path = rtrim($path, "/") . "/";
    $folder_handle = opendir($path);
    $exclude_array = explode("|", $exclude);
    $result = array();
    while(false !== ($filename = readdir($folder_handle))) {
        if(!in_array(strtolower($filename), $exclude_array)) {
            if(is_dir($path . $filename . "/")) {
                if($recursive) $result[] = file_array($path, $exclude, true);
            } else {
                $result[] = $filename;
            }
        }
    }
    return $result;
}

$args = arguments($argv);

$files = file_array($args['input'][1]);

// K.i.n.g.d.r.e.a.d
function isort($a,$b) {
    return strtolower($a)<strtolower($b);
}
uksort($files, "isort");

$minified = '';
foreach($files as $file) {
	echo $args['input'][1].'/'.$file."\n";
	$minified .= JSMin::minify(file_get_contents($args['input'][1].'/'.$file))."\n";
}

file_put_contents($args['input'][2], $minified);
?>
