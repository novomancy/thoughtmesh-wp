<?php
/*
Plugin Name: Thoughtmesh
Plugin URI: http://thoughtmesh.net/
Description: Connects your WordPress posts to the Thoughtmesh network
Version: 1.0
Author: John Bell
Author URI: http://johnpbell.info/
License: GPLv2
*/

//Thoughtmesh essays are their own post type
function create_thoughtmesh_essay() {
    register_post_type( 'thoughtmesh_essays',
        array(
            'labels' => array(
                'name' => 'Thoughtmesh Essays',
                'singular_name' => 'Thoughtmesh Essay',
                'add_new' => 'Add Essay',
                'add_new_item' => 'Add New Thoughtmesh Essay',
                'edit' => 'Edit',
                'edit_item' => 'Edit Thoughtmesh Essay',
                'new_item' => 'New Thoughtmesh Essay',
                'view' => 'View',
                'view_item' => 'View Thoughtmesh Essay',
                'search_items' => 'Search Thoughtmesh Essays',
                'not_found' => 'No Thoughtmesh Essays found',
                'not_found_in_trash' => 'No Thoughtmesh Essays found in Trash',
                'parent' => 'Parent Thoughtmesh Essay'
            ),
 
            'public' => true,
            'menu_position' => 15,
            'show_in_menu' => true,
            'show_in_admin_bar' => true,
            'supports' => array( 'title', 'editor', 'excerpt', 'author', 'revisions', 'comments', 'thumbnail', 'tags' ),
            'taxonomies' => array( 'thoughtmesh_tag' ),
            'menu_icon' => plugins_url( 'images/image.png', __FILE__ ),
            'has_archive' => true
        )
    );
}

//Create the sidebar menu for thoughtmesh essays
function thoughtmesh_admin() {
    add_meta_box( 'thoughtmesh_essay_meta_box',
        'Thoughtmesh',
        'display_thoughtmesh_essay_meta_box',
        'thoughtmesh_essays', 'side', 'low'
    );
}

// Retrieve recommended set of tags for the essay and put them in the editor's tag box
function display_thoughtmesh_essay_meta_box( $movie_review ) {
    $cats = get_categories(array('hide_empty'=>0));
    ?>
    <script>
    function tagSlug(){
        var tags = jQuery('body').thoughtmesh.getLexiaTags(tinymce.activeEditor.getContent());
        console.log(tags);
        jQuery.find('#new-tag-thoughtmesh_tag')[0].value = tags.join(',');
    }
    function submitToThoughtmesh(){
        alert("This plugin is under development. This option will be activated soon!");
    }    
    </script>
    <table>
        <tr>
            <td style="width: 100%">Collection</td>
            <td>
                <select style="width: 150px" name="thoughtmesh_collection">
                <?php foreach($cats as $cat){ ?>
                    <option value="<?php echo $cat->name; ?>" selected><?php echo $cat->name; ?></option>
                <?php } ?>
                </select>
            </td>
        </tr>
        <tr>
            <td colspan="2" align="center">
                <input type="button" name="Get Tag Suggestions" value="Get Tag Suggestions" style="width: 100%; font-size: 150%" onclick="tagSlug()">
            </td>
        </tr>
        <tr>
            <td colspan="2" align="center">
                <input type="button" name="Submit to Thoughtmesh" value="Submit to Thoughtmesh" style="width: 100%; font-size: 150%">
            </td>
        </tr>        
    </table>
    <?php
}

function register_thoughtmesh_taxonomy(){
    register_taxonomy('thoughtmesh_tag', 'thoughtmesh_essays', array(
        'hierarchical' => false, 
        'label' => "Tags", 
        'singular_name' => "Tag", 
        'rewrite' => true, 
        'query_var' => true
        )
    );
}

function add_thoughtmesh_essay_fields( $thoughtmesh_essay_id, $thoughtmesh_essay ) {
    // Check post type for thoughtmesh_essay
    if ( $thoughtmesh_essay->post_type == 'thoughtmesh_essays' ) {
        // Store data in post meta table if present in post data
        // if ( isset( $_POST['movie_review_director_name'] ) && $_POST['movie_review_director_name'] != '' ) {
        //     update_post_meta( $movie_review_id, 'movie_director', $_POST['movie_review_director_name'] );
        // }
        // if ( isset( $_POST['movie_review_rating'] ) && $_POST['movie_review_rating'] != '' ) {
        //     update_post_meta( $movie_review_id, 'movie_rating', $_POST['movie_review_rating'] );
        // }
    }
}

//Load the Thoughtmesh essay template for single-post viewing
function include_template_function( $template_path ) {
    if ( get_post_type() == 'thoughtmesh_essays' ) {
        if ( is_single() ) {
            // checks if the file exists in the theme first,
            // otherwise serve the file from the plugin
            if ( $theme_file = locate_template( array ( 'single-thoughtmesh_essays.php' ) ) ) {
                $template_path = $theme_file;
            } else {
                $template_path = plugin_dir_path( __FILE__ ) . '/single-thoughtmesh_essays.php';
            }
        }
    }
    return $template_path;
}

//Add javascript and CSS to the queue for front end posts
function thoughtmesh_register_scripts(){
    // Register the script like this for a plugin:
    wp_register_script( 'bootbox', plugins_url( '/js/bootbox.min.js', __FILE__ ), array( 'jquery' ) );
    wp_register_script( 'thoughtmesh', plugins_url( '/js/thoughtmesh.js', __FILE__ ), array( 'bootbox', 'jquery' ) );
    wp_enqueue_script('bootbox');
    wp_enqueue_script( 'thoughtmesh' );
    wp_register_style( 'thoughtmesh', plugins_url( 'thoughtmesh/css/thoughtmesh.css' ) );
    wp_enqueue_style( 'thoughtmesh' );    
}
add_action( 'wp_enqueue_scripts', 'thoughtmesh_register_scripts' );

//Add javascript and CSS to the queue for admin pages
function thoughtmesh_register_admin_scripts($hook) {
    // Load only on ?page=mypluginname
    // if($hook != 'toplevel_page_thoughtmesh') {
    //         return;
    // }
    wp_register_script( 'thoughtmesh', plugins_url( '/js/thoughtmesh.js', __FILE__ ), array( 'jquery' ) );
    wp_enqueue_script( 'thoughtmesh' );        
}
add_action( 'admin_enqueue_scripts', 'thoughtmesh_register_admin_scripts' );

add_action( 'init', 'create_thoughtmesh_essay' );
add_action( 'init', 'register_thoughtmesh_taxonomy');
add_action( 'admin_init', 'thoughtmesh_admin' );
add_action( 'save_post', 'add_thoughtmesh_essay_fields', 10, 2 );
add_filter( 'template_include', 'include_template_function', 1 );

?>