// Andy's original figures, copied without redrawing or changing their angle labels.
export const geometryDrawings={
 ackermann:{view:'Ackermann steering — turning circle',src:'psr-ackermann-drawing.jpg',alt:'Original PSR9000 report turning-circle drawing showing steered front wheels and turning radii of 1038.07 and 1214.28 mm'},
 camber:{view:'Camber — front view',src:'psr-camber-drawing.png',alt:'Andy Truong’s camber drawing of PSR9000 from the front, annotated 3.5 degrees',supplied:true},
 toe:{view:'Toe — top view',src:'psr-toe-drawing.png',alt:'Andy Truong’s toe drawing of PSR9000 from above, annotated 1.6 degrees',supplied:true},
 caster:{view:'Caster — side view',src:'psr-caster-drawing.jpg',alt:'Caster drawing from the PSR9000 design writeup, annotated 7.9 degrees'},
 kpi:{view:'KPI — front view',src:'psr-kpi-drawing.jpg',alt:'Front suspension drawing from the PSR9000 design writeup, annotated 7.1 degrees of kingpin inclination'},
 'anti-squat':{view:'Rear anti-squat — side view',src:'psr-anti-squat-drawing.jpg',alt:'Original rear suspension construction sketch showing the side-view instant center and anti-squat geometry'}
};
export function geometryFigure(id){
 const drawing=geometryDrawings[id];if(!drawing)return '';
 return `<figure class="dynamics-drawing"><img src="${drawing.src}" alt="${drawing.alt}" decoding="async"><figcaption>${drawing.view}${drawing.generated?' · Ideal geometry · <a href="https://www.mathworks.com/help/vdynblks/ref/kinematicsteering.html" target="_blank" rel="noopener">Steering model reference</a>':drawing.supplied?'':' · <a href="https://drive.google.com/file/d/1bJuKihfxswuYodcjK8dlnASuyV1QX44k/view" target="_blank" rel="noopener">Design writeup</a>'}</figcaption></figure>`;
}
