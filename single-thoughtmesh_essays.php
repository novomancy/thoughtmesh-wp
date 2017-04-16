<?php
 /*Template Name: New Thoughtmesh Essay
 */
 

get_header(); ?>

    <div id="primary" class="content-area">
        <main id="main" class="site-main" role="main">
        <?php
        $mypost = array( 'post_type' => 'thoughtmesh_essays', );
        $loop = new WP_Query( $mypost );
        ?>
        <?php while ( $loop->have_posts() ) : $loop->the_post(); ?>

            <?php get_template_part( 'content', 'single' ); ?>

            <?php the_post_navigation( array( 'prev_text' => '<span class="title">' . __( 'Previous post', 'scrawl' ) . '</span>%title', 'next_text' => '<span class="title">' . __( 'Next post', 'scrawl' ) . '</span>%title' ) ); ?>

            <div id="tm_footer">
                <div id="lexia-exerpts" style="border: 1px solid black; padding: 10px;">
                    <div id="lexias-out" style="display: block;">
                        <?php
                            // $tags = get_terms(array('taxonomy'=>'thoughtmesh_tag'));
                            // foreach($tags as $tag){
                            //     $size = mt_rand(8, 24);
                            //     echo "<a href='#' style='font-size: ".$size."px'>$tag->name</a> ";
                            // }
                        ?>
                    </div>
                </div>
            </div>

            <script type="text/javascript">
                jQuery(document).ready(function() {
                    var options = {};
                    options.externalTags = [];
                    <?php
                        $tags = get_terms(array('taxonomy'=>'thoughtmesh_tag'));
                        foreach($tags as $tag){
                            echo "options.externalTags.push(\"$tag->name\");\n";
                        }
                    ?>                     
                    jQuery('#tm_footer').thoughtmesh(options);
                    console.log(options);
                });
            </script>


            <?php
                // If comments are open or we have at least one comment, load up the comment template
                if ( comments_open() || '0' != get_comments_number() ) :
                    comments_template();
                endif;
            ?>

        <?php endwhile; // end of the loop. ?>

        </main><!-- #main -->
    </div><!-- #primary -->
<?php get_footer(); ?>