$(document).ready(function(){
    $('.delete-article').on('click', function(e){
        $target = $(e.target);
        const id = $target.attr('data-id');
        $.ajax({
            type:'DELETE',
            url: '/article/'+id,
            success: function(response){
                alert('Produkt zostanie usunięty!');
                window.location.href='/article';
            },
            error: function(err){
                console.log(err);
            }
        })
    });
});