

var tipoIZQ = 1;
var tipoOculto = 2;
var muestraListadoCapas = true;

var capasSeleccionadas = [];
var clustersSeleccionados = [];
var heatmapsSeleccionados = [];
var puntosLatLonSeleccionados = [];
var leyendasSeleccionadas = [];
var miMapa = null;
var idNacional = 0;
var markersCluster = null;
var tipoVisualizacionCapas = tipoOculto;
var botonDeImpresion;
var impresor;
var botonMuestraOcultaCapas;
var losLayersDeBase;
var losLayersParaSeleccion;
var coverages = null;
var zoomHome;


$(document).ready(function()
{
    switch(tipoVisualizacionCapas)
    {
        case tipoIZQ:       creaEstructuraPaneles();
                            creaComboEntidades();
                            creaComboGrupos();
                            creaComboEstatus();
                            break;
        case tipoOculto:    creaListadoCapas();
                            botonImpresion();
                            break;
    }
    quita000webhost();
});

function botonImpresion()
{
    //  https://cdnjs.com/libraries/dom-to-image
    //  https://fontawesome.com/v4.7.0/icon/arrow-down
    var mapaBaseSeleccionado = losLayersDeBase[0];
    impresor = L.easyPrint({
                tileLayer: mapaBaseSeleccionado,
                sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
                filename: 'Imagen_Mapa',
                exportOnly: true,
                hideControlContainer: true
                }).addTo(miMapa);
}

//Crea una leyenda con el nombre de la capa seleccionada y con la semana a la que pertenece 
function creaLeyenda(idCapa, categorizaciones, titulo, semana)
{
    leyendasSeleccionadas[idCapa] = L.control({position: 'bottomright'});

    leyendasSeleccionadas[idCapa].onAdd = function (map) 
    {
        var div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255,255,255, 0.3)';
        div.style.padding = '15px';
        
        // loop through our density intervals and generate a label with a colored square for each interval
        var htmlDIV = '';
            htmlDIV += '<b style="font-size:15px;">' + titulo + '</b>' + '<br/>';
            htmlDIV += '<b style="font-size:15px;">' + semana + '</b>' + '<br/>';
        for (var i = 0; i < categorizaciones.length; i++) 
        {
            htmlDIV += '<i style="border:1px solid #111312; background:' + categorizaciones[i].color + '"></i> ';
            //htmlDIV += '<span style="font-size:14px;" >' + categorizaciones[i].val_min + '&nbsp;' + ( (categorizaciones[i].val_min === categorizaciones[i].val_max) ? '' : '&nbsp;' + '&ndash;' + '&nbsp;' + categorizaciones[i].val_max) + '</span>' + '<br>';
            htmlDIV += categorizaciones[i].texto;
            htmlDIV += '<br/>';
        }
        div.innerHTML += htmlDIV;
        return div;
    };

    leyendasSeleccionadas[idCapa].addTo(miMapa);
}

// Crea una tabla para almacenar las listas de los selectores por Entidad, por grupos y por capas
function creaListadoCapas()
{   
    var htmlPrincipal = '';
    var urlLoading = './images/loading/loading7.gif';
    
        htmlPrincipal += '<div id="tituloPrincipal" style="font-size:20px; font-family: Charcoal, sans-serif; text-shadow: 0px 1px 1px rgba(0, 0, 0, 1); font-weight: bolder; background-color: #D0CFD4; color: #FFFFFF; text-align: left;">' + 
                                'Información Geoestadística de Seguridad Pública, Gobierno y Justicia ' +
                          '</div>';
        htmlPrincipal += '<div id="mapaPrincipal"></div>';
        htmlPrincipal += '<div id="loadingMapa" style="display: none; z-index: 9999999999999999;"><img id="imgLoading" src="' + urlLoading + '" alt="Loading" /></div>';
                    
    $('#losLayouts').html(htmlPrincipal);
    cargaInicialMapa();
    
    botonMuestraOcultaCapas = L.easyButton('fa-bars', function(btn, map)
    {
        muestraListadoCapas = !muestraListadoCapas;
        if(muestraListadoCapas)
            $('.listadoDeLasCapas').show();
        else
            $('.listadoDeLasCapas').hide();
    },{position:'topright'});       

    botonMuestraOcultaCapas.addTo(miMapa);
    
    var info = L.control({position: 'bottomleft'});
    info.onAdd = function (map) 
    {
        this._div = L.DomUtil.create('div', 'listadoDeLasCapas'); // create a div with a class "info"
        this._div.style.backgroundColor = 'rgba(255,255,255, 0.3)';
        this._div.style.padding = '0px';
        
        var htmlIzquierda = '';
        htmlIzquierda += '<div id="areaSeleccionesUsuario">';
            htmlIzquierda += '<div id="divSelectorEntidades" class="form-group"></div>';
            htmlIzquierda += '<div id="divSelectorGrupos" class="form-group"></div>';
            htmlIzquierda += '<div id="divSelectorEstatus" class="form-group"></div>';
            htmlIzquierda += '<div id="divListadoCapas"></div>';
        htmlIzquierda += '</div>';        
        
        this._div.innerHTML = htmlIzquierda; 
        
        creaComboEntidades();
        creaComboGrupos();
        creaComboEstatus();
        llenaListadoCapasSeleccionables();
        
        return this._div;
    };
    
    info.addTo(miMapa);
        
    if(muestraListadoCapas)
        $('.listadoDeLasCapas').show();
    else
        $('.listadoDeLasCapas').hide();
    
}

/*
function llenaListadoCapas()
{
    var urlObjetivo = './Ajax/AjaxListadoCapas.php';
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: {  },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la capa
            {}
            else
            {
                var capas = datosJSON[0];
                var fuentes = datosJSON[1];
                var estilos = datosJSON[2];

                var html = "";
                var fuente = '';
                var checkbox = '';
                var simbolo = '';
                var etiqueta = '';
                var datos = '';
                var listaCapas = "";
                                
                listaCapas += '<table>';
                for (var i = 0; i < capas.length; i++)
                {
                    simbolo = ''; 
                    etiqueta = '<label style="padding: 1px;">' + capas[i].titulo + '</label>';
                    if(!!parseInt(capas[i].usa_icono) === true)
                    {   simbolo  =  '<img id="simbologia_idCapa_' + (capas[i].id_capa) + '" src="' + (capas[i].url_icon + capas[i].archivo_icon) + '" style="max-width:25px;" />'; }
                    else
                    {
                        var elEstilo = regresaFuenteSegunIdCapa(capas[i].id_capa, estilos);
                        switch (capas[i].tipo)
                        {
                            case 'Puntos':  simbolo = '<div style="background-color: ' + elEstilo.color + '; border: 1px solid '+ elEstilo.color + '; border-radius: 100%; width: 15px; height: 15px; "></div>';
                                            break;
                            case 'Lineas':  simbolo = '<div style="font-size: 23px; color: ' + elEstilo.color + ';"><b>___</b></div>';
                                            break;
                            case 'Polígonos':   simbolo = '';
                                            break;
                        }
                        
                    }
                    
                    alert(55)
                    // simbolo  = '<a href="' + capas[i].url_shp + capas[i].archivo_shp + '"><img src="' + './images/descargaShape.png' + '" style="max-width:18px;"></a>';
                    fuente = '<img id="fuente_idCapa_' + (capas[i].id_capa) + '" src="' + './images/fuente.png' + '" style="max-width:18px;" class="mensajeFuente" />';
                    checkbox = '<input class="checkCapas"  style="width:17px; height:17px;" type="checkbox" name="' + 'losChecks' + '">';    
                    
                    listaCapas += '<tr>';
                    listaCapas += '<td style="padding: 00px;">' + checkbox + '<td>';
                    listaCapas += '<td style="padding: 00px; text-align: left;">' + etiqueta + '<td>';
                    listaCapas += '<td style="padding: 00px;">' + '<center>' + simbolo + '</center>' + '<td>';
                    listaCapas += '<td style="padding: 00px;">' + fuente + '<td>';
                    listaCapas += '<tr>';
                }
                listaCapas += '</table>';

                clickCapaSeleccionada();
                html += '<div style="overflow-y: scroll;">' + listaCapas + '</div>';
        
                $('#divListadoCapas').html(html);                
                clickCapaSeleccionada();
                
                var htmlFuente = '';
                for (var i = 0; i < capas.length; i++)
                {
                    var fuente = regresaFuenteSegunIdCapa(capas[i].id_capa, fuentes);
                        htmlFuente = '';
                        htmlFuente += '<div>';
                        htmlFuente += fuente['fuente'] + '<br/>';
                        htmlFuente += 'URL: <b><a style="color: #9FF781" target="_blank" href="' + fuente['url']  + '">' + fuente['siglas']  + '</a></b>' + '<br/>';
                        htmlFuente += 'Actualización: <b style="color: #9FF781">' + cambiaFormatoFecha(fuente['fecha_actualizacion'], 1)  + '</b>';
                        htmlFuente += '</div>';
                        
                    $('#fuente_idCapa_' + (capas[i].id_capa)).tooltipster(
                    {
                        animation: 'fade',
                        delay: 200,
                        theme: 'tooltipster-punk',
                        trigger: 'click',
                        side: 'right',
                        contentAsHTML: true,
                        content: $(htmlFuente),
                        interactive: true
                    });
                }
            }
        },
        error: function (xhr, err)
        {}
    });
}*/

//Carga el mapa de la pagina principal 
function cargaInicialMapa()
{
    var idEntidadSel = $('#selectorEntidades option:selected').val();
        idEntidadSel = (idEntidadSel === undefined) ? 0 : idEntidadSel;
        
    //  Obtiene coordenadas del centro, y extremos del mapa de la entidad
    var puntos = puntosEntidades(idEntidadSel);

    //  Centro visual del mapa
    var centroEntidad = puntos[2];

    //  Limites de Mapa
    var esquinaSuperior = L.latLng(puntos[0][0], puntos[0][1]);
    var esquinaInferior = L.latLng(puntos[1][0], puntos[1][1]);
    var limitesMapa = L.latLngBounds(esquinaSuperior, esquinaInferior);

    //  Zoom
    var zoomArea = puntos[3];

    //  Elimina el mapa anterior en caso de existir
    if (miMapa) { miMapa.remove(); miMapa = null; }

    miMapa = L.map("mapaPrincipal",
    {
        center: centroEntidad,
        zoomControl: false,
        zoom: zoomArea[0], minZoom: zoomArea[0], maxZoom: zoomArea[1], zoomDelta: 0.25, zoomSnap: 0,
        layers: listaMapasBase()[0]
    });

    //  Boton de zoom en Home
    zoomHome = L.Control.zoomHome();
    zoomHome.addTo(miMapa);
    zoomHome.setHomeBounds(limitesMapa);

    //  Mueve el vio al centro de los limites
    //  Lo que esta comentado, fija el movimiento
    miMapa.fitBounds(limitesMapa);
    //miMapa.setMaxBounds(limitesMapa);
    //miMapa.on('drag', function () { miMapa.panInsideBounds(limitesMapa, { animate: false }); });
    L.control.layers(listaMapasBase()[1], null).addTo(miMapa);
    
    quitaLinkLeaflet();
}

//si en el selector de entidades se selecciona una en especifico se hace enfoque en es entidad
function cambiaEntidadMapa()
{
    var idEntidadSel = $('#selectorEntidades option:selected').val();

    //  Obtiene coordenadas del centro, y extremos del mapa de la entidad
    var puntos = puntosEntidades(idEntidadSel);
    //  Centro visual del mapa
    var centroEntidad = puntos[2];

    //  Limites de Mapa
    var esquinaSuperior = L.latLng(puntos[0][0], puntos[0][1]);
    var esquinaInferior = L.latLng(puntos[1][0], puntos[1][1]);
    var limitesMapa = L.latLngBounds(esquinaSuperior, esquinaInferior);

    //  Zoom
    var zoomArea = puntos[3];

    //  Cambia primero los topes de zoom y despues se mueve
    miMapa.options.minZoom = zoomArea[0];
    miMapa.options.maxZoom = zoomArea[1];
    zoomHome.setHomeBounds(limitesMapa);

    //  Mueve el vio al centro de los limites
    //  Lo que esta comentado, fija el movimiento
    miMapa.fitBounds(limitesMapa);
    //  Marca los límites del area (entidad) seleccionada
    //miMapa.setMaxBounds(limitesMapa);
    //miMapa.on('drag', function () { miMapa.panInsideBounds(limitesMapa, { animate: false }); });
    miMapa.setZoom(zoomArea[0]);    
    miMapa.panTo(centroEntidad);
}

// carga los estilos del mapa que se carga el inicio en la patnalla inicial
function listaMapasBase()
{
    //  https://leaflet-extras.github.io/leaflet-providers/preview/
    var mapaBaseUrl_1 = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        mapaBaseAttr_1 = ''; //'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        mapaBase_1 = L.tileLayer(mapaBaseUrl_1, 
        {
            maxZoom: 19,
            attribution: mapaBaseAttr_1
        }); //.addTo(miMapa);
        
    var mapaBaseUrl_2 = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
        mapaBaseAttr_2 = ''; //'<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
        mapaBase_2 = L.tileLayer(mapaBaseUrl_2, 
        {
            maxZoom: 19,
            attribution: mapaBaseAttr_2
        });      
        
    var mapaBaseUrl_3 = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        mapaBaseAttr_3 = ''; //'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        mapaBase_3 = L.tileLayer(mapaBaseUrl_3,
        {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: mapaBaseAttr_3
        });        

    var mapaBaseUrl_4 = 'https://korona.geog.uni-heidelberg.de/tiles/roads/x={x}&y={y}&z={z}',
        mapaBaseAttr_4 = ''; //'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        mapaBase_4 = L.tileLayer(mapaBaseUrl_4,
        {
            maxZoom: 19,
            attribution: mapaBaseAttr_4
        });        

    var mapaBaseUrl_5 = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        mapaBaseAttr_5 = ''; //'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        mapaBase_5 = L.tileLayer(mapaBaseUrl_5,
        {
            attribution: mapaBaseAttr_5
        });        

    var mapaBaseUrl_6 = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        mapaBaseAttr_6 = ''; //'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        mapaBase_6 = L.tileLayer(mapaBaseUrl_6,
        {
            attribution: mapaBaseAttr_6
        });  

    var mapaBaseUrl_7 = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        mapaBaseAttr_7 = ''; //'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        mapaBase_7 = L.tileLayer(mapaBaseUrl_7,
        {
            attribution: mapaBaseAttr_7,
            subdomains: 'abcd',
            maxZoom: 19            
        });  

    var mapaBaseUrl_8 = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
        mapaBaseAttr_8 = ''; //'<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>'
        mapaBase_8 = L.tileLayer(mapaBaseUrl_8,
        {
            attribution: mapaBaseAttr_8,
            minZoom: 1,
            maxZoom: 19     
        });  

      losLayersDeBase = [mapaBase_2, mapaBase_3, /*mapaBase_4,*/ mapaBase_5, mapaBase_6, mapaBase_7, mapaBase_8, mapaBase_1];
      losLayersParaSeleccion =     
      {
        "Básico": mapaBase_1,
        "Dark": mapaBase_7,
        "Google-Maps": mapaBase_2,
        "Ciudades": mapaBase_3,
        //"Carreteras y Caminos": mapaBase_4,
        "Topográfico": mapaBase_5,
        "Satelital": mapaBase_6,
        "Wiki": mapaBase_8
    };
    return [losLayersDeBase, losLayersParaSeleccion];
}


// se carga la capa seleccionada a partir de la seleccion en el combo box que se creó
function cargaCapaSeleccionada(idCapa)
{
    var idEntidadSel = $('#selectorEntidades option:selected').val();
    var urlObjetivo = './Ajax/AjaxBuscaCapaSeleccionada.php';
    
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: { idCapa:idCapa },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la capa
            {}
            else
            {
                var datosCapa = datosJSON[0][0];
                var registroDatosEstilo = datosJSON[1][0];
                var listaAtributosAMostrar = datosJSON[2];
                var categorizacion = datosJSON[3];
                
                var urlDelArchivoGeoJson = datosCapa.url_geojson + datosCapa.archivo_geojson;

                muestraOcultaLoading(true);
                $.getJSON(urlDelArchivoGeoJson,function(data)
                {                    
                    var elIcono = L.icon(
                    {
                        iconUrl: datosCapa.url_icon + datosCapa.archivo_icon,
                        iconSize: [datosCapa.largo_icon,datosCapa.ancho_icon]
                    });
                    
                    //  Si se tiene una categorización de colores, se muestra el cuadros
                    if(categorizacion.length > 0)
                        creaLeyenda(datosCapa.id_capa, categorizacion, datosCapa.titulo, datosCapa.semana_etiq);

                    
                    capasSeleccionadas[datosCapa.id_capa] = L.geoJSON(data,
                    {
                        pointToLayer: function (feature, latlng)
                        {
                            if(!!parseInt(datosCapa.usa_icono) === true)
                            {
                                return L.marker(latlng, estiloPuntos( feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo, elIcono ));                                
                            }
                            else
                            {
                                return L.circleMarker(latlng, estiloPuntos( feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo, null ));
                            }
                        },

                        onEachFeature: function (feature, layer) 
                        {
                            var accionesInteraccion = '';
                            layer.idCapa = datosCapa.id_capa;
                            accionesInteraccion = (datosCapa.tipo !== 'Poligonos' ) ? 'click touchstart' : 'click touchstart';
                            layer.on(accionesInteraccion, function( event ) 
                            {
                                clickCapa(event, listaAtributosAMostrar);
                            });
                            
                            if (layer instanceof L.Polyline) 
                            {
                                switch(datosCapa.tipo)
                                {
                                    case 'Puntos':  break;
                                    case 'Lineas':  layer.setStyle(estiloLineas(registroDatosEstilo));     break;
                                    case 'Poligonos':  layer.setStyle(estiloCoropletas(feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo));     break;
                                }
                            }
                        },
                        
                        filter: function (feature, layer) 
                        {
                            var resultado = true;
                            var idEntidadSel = $('#selectorEntidades option:selected').val();
                            //  Regresa true (si se muestra) en los siguientes casos
                            //      -   La entidad seleccionada es NACIONAL
                            //      -   Cuando la capa no tiene el campo de entidad como filtro en la tabla
                            //      -   La entidad seleccionada [01 - 32] es la misma que tiene el feature analizado
                            //  Falso en cualquier opción contraria   
                            if( ((parseInt(idEntidadSel) === parseInt(idNacional))) )
                            {
                                resultado = true;
                            }
                            else
                            {
                                if( (datosCapa.filtro_entidad === null) )
                                {
                                    resultado = true;
                                }
                                else
                                {
                                    var valorEntidadFeature = parseInt(feature.properties[datosCapa.filtro_entidad]);
                                    if( isNaN(valorEntidadFeature) )
                                    {
                                        resultado = false;
                                    }
                                    else
                                    {
                                        if( valorEntidadFeature === parseInt(idEntidadSel) )
                                        {
                                            resultado = true;
                                        }
                                        else
                                        {
                                            resultado = false;
                                        }
                                    }
                                }                                
                            }
                                                        
                            return resultado;
                        }
                    });
                    
                    muestraOcultaLoading(false);
                    var locations = data.features.map(function(rat) {
                      if(parseInt(idEntidadSel) === parseInt(idNacional) || parseInt(rat.properties[datosCapa.filtro_entidad]) === parseInt(idEntidadSel))
                      {
                          switch(parseInt(datosCapa.id_capa))
                          {
                              case 21:  
                              case 22:
                                        if( ((parseInt(rat.properties['t_EDAD']) >= 0) && (parseInt(rat.properties['t_EDAD']) <= 17)) )
                                        {
                                            console.log(rat.properties[datosCapa.filtro_entidad] + ", " + idEntidadSel); 
                                            var location = rat.geometry.coordinates.reverse();
                                            location.push(3);
                                            return location; // e.g. [50.5, 30.5, 0.2], // lat, lng, intensity                                       
                                        }
                                        else
                                        {
                                            return [0,0,0];
                                        }                                  
                                        break;
                              default:  
                                        console.log(rat.properties[datosCapa.filtro_entidad] + ", " + idEntidadSel); 
                                        var location = rat.geometry.coordinates.reverse();
                                        location.push(3);
                                        return location; // e.g. [50.5, 30.5, 0.2], // lat, lng, intensity       
                                        break;
                          }
                      }
                      else
                          return [0,0,0];
                    });
                    
                    puntosLatLonSeleccionados[datosCapa.id_capa] = locations;  

                    //
                    if(!!parseInt(datosCapa.clustering) === true)
                    {
                        clustersSeleccionados[datosCapa.id_capa] = L.markerClusterGroup({});
                        //  Mantiene las areas de covertura
                        var mantenerAreasClusters = true;
                        coverages = new L.LayerGroup();
                        if( ((parseInt(idEntidadSel) !== parseInt(idNacional))) )
                        {
                            if(mantenerAreasClusters === true)
                            {
                                clustersSeleccionados[datosCapa.id_capa].on("animationend", function() 
                                {
                                  coverages.clearLayers();
                                  clustersSeleccionados[datosCapa.id_capa]._featureGroup.eachLayer(function(layer) {
                                    if (layer instanceof L.MarkerCluster && layer.getChildCount() > 2) {
                                      //mcg._showCoverage({ layer: layer });
                                    var estiloArea = 
                                    {
                                        fillColor: "#00a86b",
                                        color: "#000",
                                        weight: 0,
                                        opacity: 1,
                                        fillOpacity: 0.3
                                    };
                                    coverages.addLayer(L.polygon(layer.getConvexHull()).setStyle(estiloArea));

                                    }
                                    coverages.addTo(miMapa);
                                  });
                                });
                            }
                        }

                        clustersSeleccionados[datosCapa.id_capa].fire("animationstart");
                        
                        clustersSeleccionados[datosCapa.id_capa].addLayer(capasSeleccionadas[datosCapa.id_capa]);
                        miMapa.addLayer(clustersSeleccionados[datosCapa.id_capa]);
                        miMapa.fitBounds(clustersSeleccionados[datosCapa.id_capa].getBounds());
                    }
                    else
                    {
                        if(!!parseInt(datosCapa.heatmap) === true)
                        {
                            heatmapsSeleccionados[datosCapa.id_capa] = L.heatLayer(puntosLatLonSeleccionados[datosCapa.id_capa], { radius: 25 });
                            miMapa.addLayer(heatmapsSeleccionados[datosCapa.id_capa]);
                        }
                        else
                        {
                            capasSeleccionadas[datosCapa.id_capa].addTo(miMapa);                        
                        }
                    }
                    

                });
            }
        },
        error: function (xhr, err)
        {}
    });
}


function clickCapa(event, atributos) 
{
    var marker = event.target;
    //    var propiedades = event.target.feature.properties;
    //  Se quita la ventana de datos
        marker.unbindPopup();

    //miMapa.setView([event.latlng.lat, event.latlng.lng], miMapa.getZoom());

    //  Se muestra la tabla de datos
    marker.bindPopup(tablaDatosCapa(event, atributos));
    marker.openPopup();
}

// Genera una tabla con los datos del estado cuando haya un clic encima del estado
function tablaDatosCapa(event, atributos)
{
    var tabla = '';
    var valores = event.target.feature.properties;

    tabla += '';
    tabla += '<table class="tablaDatosLugar">';
    for (var i = 0; i < atributos.length; i++) 
    {
        var elRotulo = atributos[i]['rotulo'];
        var elValor = valores[atributos[i]['nom_campo']];
            elValor = (elValor !== null) ? elValor : '';
            
            switch(atributos[i]['orden'])
            {
                case 'float':   elValor = parseFloat(elValor);
                                elValor = elValor.toFixed(2);
                                break;
                default:        break;
            }
            
        tabla += '<tr class="renglonTablaDatosLugar">';
            tabla += '<td class="celdaTablaDatosLugar rotuloCelda" style="text-align:right">' + (elRotulo) + '<td>';
            tabla += '<td class="celdaTablaDatosLugar" style="text-align:right">' + '&nbsp;&nbsp;' + '<td>';
            tabla += '<td class="celdaTablaDatosLugar" style="text-align:left">' + (elValor) + ' ' + ((atributos[i]['simbolos'] === null) ? '' : atributos[i]['simbolos']) + '<td>';
        tabla += '<tr>';
    }
    tabla += '</table>';
    
    return tabla;
}

function encode_utf8(s) 
{
  return s; //unescape(encodeURIComponent(s));
}

function decode_utf8(s) 
{
    var utf8Text = s;
    try 
    {
        utf8Text = decodeURIComponent(escape(utf8Text));
    }
    catch(e) 
    {
        utf8Text = s;
    }   

    return utf8Text;    
}

function cargaCapaContorno()
{
    var idEntidadSel = $('#selectorEntidades option:selected').val();
    var urlDelArchivoGeoJsonContornos = './GeoJSON/Contornos/' + idEntidadSel + '.geojson';
    $.getJSON(urlDelArchivoGeoJsonContornos,function(data)
    {
        L.geoJSON(data,
        {
            onEachFeature: function (feature, layer) 
            {
                layer.idCapa = 'Contorno';
                if (layer instanceof L.Polyline) 
                {
                    layer.setStyle(estiloCapaContorno());
                }   
            }
        }).addTo(miMapa);                        
    });
}

function cargaCapasEstatus(idCapa)
{
    var idEntidadSel = $("#selectorEstatus").val();
    var urlObjetivo = './Ajax/AjaxBuscaEstatusSeleccionado.php';
    
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: { idCapa:idCapa },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la capa
            {}
            else
            {
                var datosCapa = datosJSON[0][0];
                var registroDatosEstilo = datosJSON[1][0];
                var listaAtributosAMostrar = datosJSON[2];
                var categorizacion = datosJSON[3];
                
                var urlDelArchivoGeoJson = datosCapa.url_geojson + datosCapa.archivo_geojson;

                muestraOcultaLoading(true);
                $.getJSON(urlDelArchivoGeoJson,function(data)
                {                    
                    var elIcono = L.icon(
                    {
                        iconUrl: datosCapa.url_icon + datosCapa.archivo_icon,
                        iconSize: [datosCapa.largo_icon,datosCapa.ancho_icon]
                    });
                    
                    //  Si se tiene una categorización de colores, se muestra el cuadros
                    if(categorizacion.length > 0)
                        creaLeyenda(datosCapa.id_capa, categorizacion, datosCapa.titulo);

                    
                    capasSeleccionadas[datosCapa.id_capa] = L.geoJSON(data,
                    {
                        pointToLayer: function (feature, latlng)
                        {
                            if(!!parseInt(datosCapa.usa_icono) === true)
                            {
                                return L.marker(latlng, estiloPuntos( feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo, elIcono ));                                
                            }
                            else
                            {
                                return L.circleMarker(latlng, estiloPuntos( feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo, null ));
                            }
                        },

                        onEachFeature: function (feature, layer) 
                        {
                            var accionesInteraccion = '';
                            layer.idCapa = datosCapa.id_capa;
                            accionesInteraccion = (datosCapa.tipo !== 'Poligonos' ) ? 'click touchstart' : 'click touchstart';
                            layer.on(accionesInteraccion, function( event ) 
                            {
                                clickCapa(event, listaAtributosAMostrar);
                            });
                            
                            if (layer instanceof L.Polyline) 
                            {
                                switch(datosCapa.tipo)
                                {
                                    case 'Puntos':  break;
                                    case 'Lineas':  layer.setStyle(estiloLineas(registroDatosEstilo));     break;
                                    case 'Poligonos':  layer.setStyle(estiloCoropletas(feature, datosCapa.campo_valor, categorizacion, registroDatosEstilo));     break;
                                }
                            }
                        },
                        
                        filter: function (feature, layer) 
                        {
                            var resultado = true;
                            var idEntidadSel = $('#selectorEntidades option:selected').val();
                            //  Regresa true (si se muestra) en los siguientes casos
                            //      -   La entidad seleccionada es NACIONAL
                            //      -   Cuando la capa no tiene el campo de entidad como filtro en la tabla
                            //      -   La entidad seleccionada [01 - 32] es la misma que tiene el feature analizado
                            //  Falso en cualquier opción contraria   
                            if( ((parseInt(idEntidadSel) === parseInt(idNacional))) )
                            {
                                resultado = true;
                            }
                            else
                            {
                                if( (datosCapa.filtro_entidad === null) )
                                {
                                    resultado = true;
                                }
                                else
                                {
                                    var valorEntidadFeature = parseInt(feature.properties[datosCapa.filtro_entidad]);
                                    if( isNaN(valorEntidadFeature) )
                                    {
                                        resultado = false;
                                    }
                                    else
                                    {
                                        if( valorEntidadFeature === parseInt(idEntidadSel) )
                                        {
                                            resultado = true;
                                        }
                                        else
                                        {
                                            resultado = false;
                                        }
                                    }
                                }                                
                            }
                                                        
                            return resultado;
                        }
                    });
                    
                    muestraOcultaLoading(false);
                    var locations = data.features.map(function(rat) {
                      if(parseInt(idEntidadSel) === parseInt(idNacional) || parseInt(rat.properties[datosCapa.filtro_entidad]) === parseInt(idEntidadSel))
                      {
                          switch(parseInt(datosCapa.id_capa))
                          {
                              case 21:  
                              case 22:
                                        if( ((parseInt(rat.properties['t_EDAD']) >= 0) && (parseInt(rat.properties['t_EDAD']) <= 17)) )
                                        {
                                            console.log(rat.properties[datosCapa.filtro_entidad] + ", " + idEntidadSel); 
                                            var location = rat.geometry.coordinates.reverse();
                                            location.push(3);
                                            return location; // e.g. [50.5, 30.5, 0.2], // lat, lng, intensity                                       
                                        }
                                        else
                                        {
                                            return [0,0,0];
                                        }                                  
                                        break;
                              default:  
                                        console.log(rat.properties[datosCapa.filtro_entidad] + ", " + idEntidadSel); 
                                        var location = rat.geometry.coordinates.reverse();
                                        location.push(3);
                                        return location; // e.g. [50.5, 30.5, 0.2], // lat, lng, intensity       
                                        break;
                          }
                      }
                      else
                          return [0,0,0];
                    });
                    
                    puntosLatLonSeleccionados[datosCapa.id_capa] = locations;  

                    //
                    if(!!parseInt(datosCapa.clustering) === true)
                    {
                        clustersSeleccionados[datosCapa.id_capa] = L.markerClusterGroup({});
                        //  Mantiene las areas de covertura
                        var mantenerAreasClusters = true;
                        coverages = new L.LayerGroup();
                        if( ((parseInt(idEntidadSel) !== parseInt(idNacional))) )
                        {
                            if(mantenerAreasClusters === true)
                            {
                                clustersSeleccionados[datosCapa.id_capa].on("animationend", function() 
                                {
                                  coverages.clearLayers();
                                  clustersSeleccionados[datosCapa.id_capa]._featureGroup.eachLayer(function(layer) {
                                    if (layer instanceof L.MarkerCluster && layer.getChildCount() > 2) {
                                      //mcg._showCoverage({ layer: layer });
                                    var estiloArea = 
                                    {
                                        fillColor: "#00a86b",
                                        color: "#000",
                                        weight: 0,
                                        opacity: 1,
                                        fillOpacity: 0.3
                                    };
                                    coverages.addLayer(L.polygon(layer.getConvexHull()).setStyle(estiloArea));

                                    }
                                    coverages.addTo(miMapa);
                                  });
                                });
                            }
                        }

                        clustersSeleccionados[datosCapa.id_capa].fire("animationstart");
                        
                        clustersSeleccionados[datosCapa.id_capa].addLayer(capasSeleccionadas[datosCapa.id_capa]);
                        miMapa.addLayer(clustersSeleccionados[datosCapa.id_capa]);
                        miMapa.fitBounds(clustersSeleccionados[datosCapa.id_capa].getBounds());
                    }
                    else
                    {
                        if(!!parseInt(datosCapa.heatmap) === true)
                        {
                            heatmapsSeleccionados[datosCapa.id_capa] = L.heatLayer(puntosLatLonSeleccionados[datosCapa.id_capa], { radius: 25 });
                            miMapa.addLayer(heatmapsSeleccionados[datosCapa.id_capa]);
                        }
                        else
                        {
                            capasSeleccionadas[datosCapa.id_capa].addTo(miMapa);                        
                        }
                    }
                    

                });
            }
        },
        error: function (xhr, err)
        {}
    });
}




function desapareceCapaDeseleccionada(idCapa)
{
    //  Las capas adheridas normalmente
    miMapa.eachLayer( function(layer) 
    {
        if ( layer.idCapa &&  layer.idCapa === idCapa) 
        {
            miMapa.removeLayer(layer)
        }
    });

    //  Elimina los cluster agregados
    for (var key in clustersSeleccionados)
    {
        if ( key === idCapa) 
        {
            
            miMapa.removeLayer(clustersSeleccionados[key]);
        }
    }
    
    //  Elimina heatmaps
    for (var key in heatmapsSeleccionados)
    {
        if ( key === idCapa) 
        {
            miMapa.removeLayer(heatmapsSeleccionados[key]);
        }
    }    
    
    //  Elimina las leyendas creadas
    for (var key in leyendasSeleccionadas)
    {
        if ( key === idCapa) 
        {
            miMapa.removeControl(leyendasSeleccionadas[key]);
        }
    }

    if(coverages !== null)
    {
        //coverages.eachLayer(function(layer) { miMapa.removeLayer(layer);});
        coverages.eachLayer(function(layer) { coverages.removeLayer(layer);});
        miMapa.removeLayer(coverages);
    }
    
}



function desapareceCapaDeseleccionadaEstatus(idCapa)
{
    //  Las capas adheridas normalmente
    miMapa.eachLayer( function(layer) 
    {

        if ( layer.idCapa &&  layer.idCapa === idCapa) 
        {
            miMapa.removeLayer(Layer)
        }
    });

    //  Elimina los cluster agregados
    for (var key in clustersSeleccionados)
    {
        if ( key === idCapa) 
        {
            
            miMapa.removeLayer(clustersSeleccionados[key]);
        }
    }
    
    //  Elimina heatmaps
    for (var key in heatmapsSeleccionados)
    {
        if ( key === idCapa) 
        {
            miMapa.removeLayer(heatmapsSeleccionados[key]);
        }
    }    
    
    //  Elimina las leyendas creadas
    for (var key in leyendasSeleccionadas)
    {
        if ( key === idCapa) 
        {
            miMapa.removeControl(leyendasSeleccionadas[key]);
        }
    }

    if(coverages !== null)
    {
        //coverages.eachLayer(function(layer) { miMapa.removeLayer(layer);});
        coverages.eachLayer(function(layer) { coverages.removeLayer(layer);});
        miMapa.removeLayer(coverages);
    }
    
}


//Se genera la estructura de los paneles en la parte inferior izquierda
function creaEstructuraPaneles()
{
    var htmlPrincipal = '';
    var htmlIzquierda = '';
    var urlLoading = './images/loading/loading7.gif';
    
        htmlPrincipal += '<div id="mapaPrincipal"></div>';
        htmlPrincipal += '<div id="loadingMapa" style="display: none; z-index: 9999999999999999;"><img id="imgLoading" src="' + urlLoading + '" alt="Loading" /></div>';
        
        htmlIzquierda += '<div id="areaSeleccionesUsuario">';
            htmlIzquierda += '<div id="divSelectorEntidades" class="form-group"></div>';
            htmlIzquierda += '<div id="divSelectorGrupos" class="form-group"></div>';
            htmlIzquierda += '<div id="divSelectorEstatus" class="form-group"></div>';
            htmlIzquierda += '<div id="divListadoCapas"></div>';
        htmlIzquierda += '</div>';
        
        htmlPrincipal += '<div id="leyenda"></div>';
        
    var estiloPrincipal = 'border: 1px solid #dfdfdf; padding: 5px;';
    var estiloIzquierda = 'border: 1px solid #dfdfdf; padding: 5px;';
    
    $('#losLayouts').w2layout(
    {
        name: 'layout',
        panels: 
        [
            { type: 'left', resizable: true, size: '25%', style: estiloIzquierda, content: htmlIzquierda },
            { type: 'main', resizable: true, size: '75%', style: estiloPrincipal, content: htmlPrincipal }
        ]
    });
    
    llenaListadoCapasSeleccionables();
}

//llena el combo de las semanas con sus respectivas capas 
function llenaListadoCapasSeleccionables()
{
    var urlObjetivo = './Ajax/AjaxListadoCapas.php';

    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: { /*id_grupo: $('#selectorEntidades').val()*/  },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la capa
            {}
            else
            {
                var capas = datosJSON[0];
                var semanas = datosJSON[1];
                var estilos = datosJSON[2];
                var categorizaciones = datosJSON[3];
                var grupos = datosJSON[4];
                var semanas2 = datosJSON[5]

                var html = "";
                var fuente = '';
                var checkbox = '';
                var simbolo = '';
                var etiqueta = '';
                var datos = '';
                var listaCapas = "";
                var listaSemanas = "";
                                
                var divVerticalTabs = '<div id="verticalTabs">';
                    divVerticalTabs += '<ul class="resp-tabs-list ver_1">';
                for (var i = 0; i < semanas.length; i++)     divVerticalTabs += '<li>' + semanas[i]['Num_semana'] + '</li>';
                    divVerticalTabs += '</ul>';


                    divVerticalTabs += '<div class="resp-tabs-container ver_1">';
                    for (var i = 0; i < semanas.length; i++)
                    {
                        listaCapas = '<table>';
                        for (var j = 0; j < capas.length; j++)
                        {
                            if(capas[j].semana !== semanas[i]['Id_semana'])  
                                continue;
                            
                            simbolo = ''; 
                            etiqueta = '<label style="font-size: 14px; padding: 0px;">' + capas[j].titulo + '</label>';
                            
                            //checkbox = '<input class="checkCapas"  style="width:18px; height:18px;" type="checkbox" name="' + capas[j].id_capa + '">';    
                            checkbox = '<input class="checkCapas"  style="width:18px; height:18px;" type="checkbox" name="' + capas[j].id_capa + '">';      
                            listaCapas += '<tr>';
                            listaCapas += '<td style="padding: 00px;">' + checkbox + '<td>';
                            listaCapas += '<td style="padding: 05px; text-align: left;">' + etiqueta + '<td>';
                            listaCapas += '<tr>';
                            
                        }
                        listaCapas += '</table>';

                        divVerticalTabs += '<div>';
                        divVerticalTabs += listaCapas;
                        divVerticalTabs += '</div>';           
                    }
                    divVerticalTabs += '</div>';
                    divVerticalTabs += '</div>';    
                
                html += '<div style="height:250px; width: 300px; overflow: visible;"><span><label> Semanas </label></span>'+ divVerticalTabs + '</div>'; //  ;
                
                $('#divListadoCapas').html(html);               
                clickCapaSeleccionada();
                changeComboEntidades2();
                
                $('#verticalTabs').easyResponsiveTabs({
                    type: 'accordion',
                    width: 'auto',
                    fit: true,
                    closed: 'accordion',
                    tabidentify: 'ver_1', // The tab groups identifier
                    activetab_bg: '#fff', // background color for active tabs in this group
                    inactive_bg: '#F5F5F5', // background color for inactive tabs in this group
                    active_border_color: '#c1c1c1', // border color for active tabs heads in this group
                    active_content_border_color: '#5AB1D0' // border color for active tabs contect in this group so that it matches the tab head border
                });

            }
        },
        error: function (xhr, err)
        {}
    });
}


function regresaFuenteSegunIdCapa(idCapa, fuentes)
{
    for (var i = 0; i < fuentes.length; i++)
    {
        if(fuentes[i].id_capa == idCapa)
            return fuentes[i];
    }
    
    return null;
}

//agrega los datos al mapa según la capa seleccionada en el panel de seleccion
function clickCapaSeleccionada()
{
    $('.checkCapas').change(function() 
    {

        $('.checkCapas:checked').each(function()
        {
            var idCapa = $(this).attr("name");
            desapareceCapaDeseleccionada(idCapa);
        });    
        
        $('input[type="checkbox"]').not(this).prop('checked', false);

        var idCapa = $(this).attr("name");
        if($(this).is(":checked"))  
        {
            //  Se debe mostrar la capa

            cargaCapaSeleccionada(idCapa);
            //alert($("#verticalTabs").val());
        }
        else
        {
            //  Se debe ocultar la capa
            desapareceCapaDeseleccionada(idCapa);
        }
    });    
}

// se genera un cobo para elegir las entidades
function creaComboEntidades()
{
    var urlObjetivo = './Ajax/AjaxListadoEntidades.php';
    var titulo = 'Entidades'; // Información de Hidrocarburos';
    
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: {  },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la tabal de entidades
            {}
            else
            {
                var html = "";
                var selDeEntidades = "";
                                
                selDeEntidades += '<h5 style="text-align:left; margin: 0px">' + '<label>' + titulo + '</label>' + '</h5>';

                //selDeEntidades += '<label class="col-xs-15 control-label">Seleccione una entidad</label>';
                selDeEntidades += '<select class="form-control" style="margin-bottom: 0px !important"  id="selectorEntidades" onchange="getselectedvalue();">';
                selDeEntidades += '<option value="' + 0 + '" selected="selected">' + "Nacional" + '</option>';     
                for (var i = 0; i < datosJSON.length; i++)
                {
                    selDeEntidades += '<option class="optionSelectorEntidades" value="' + datosJSON[i].idEntidad  + '" >' + datosJSON[i].nombreCorto + '</option>';                    
                }
                selDeEntidades += '</select>';
                html += '<div>' + selDeEntidades + '</div>';
        
                $('#divSelectorEntidades').html(html);
                cargaCapaContorno();
                changeComboEntidades();
                if(tipoVisualizacionCapas === tipoIZQ) cargaInicialMapa();
            }
        },
        error: function (xhr, err)
        {}
    });
}

//Crea un commo de los grupos para seleccionarlos 
function creaComboGrupos()
{
    var urlObjetivo = './Ajax/AjaxListadoGrupos.php';
    var titulo = 'Módulos'; // Información de Hidrocarburos';
    
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        data: {  },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            var datosJSON = JSON.parse(datos);
            if(datosJSON === "") //  No existe la tabal de entidades
            {}
            else
            {
                var html = "";
                var selDeGrupos = "";
                
                                
                selDeGrupos += '<h5 style="text-align:left; margin: 0px">' + '<label>' + titulo + '</label>' + '</h5>';

                //selDeGrupos += '<label class="col-xs-15 control-label">Seleccione una entidad</label>';
                selDeGrupos += '<select class="form-control" style="margin-bottom: 0px !important"  id="selectorGrupos" onchange="getselectedvalue();">';
                selDeGrupos += '<option value="' + 0 + '" selected="selected">' + "Seleccione un Módulo" + '</option>';     
                
                for (var i = 0; i < datosJSON.length; i++)
                {
                    
                    selDeGrupos += '<option class="optionSelectorGrupos" value="' + datosJSON[i].id_grupo  + '" >' + datosJSON[i].nombre + '</option>';                    
                }
//                selDeGrupos += '$("#selectorGrupos").show();';
//                selDeGrupos += '$("#selectorGrupos").val("00");';
//                selDeGrupos += '$("#selectorGrupos").change();';
                selDeGrupos += '</select>';

                html += '<div>' + selDeGrupos + '</div>';
                
                $('#divSelectorGrupos').html(html);


                $("#divSelectorGrupos").change(function() 
                {
                    //alert($("#selectorGrupos :selected").val());
                    creaComboEstatus();

                });




                //creaComboEstatus();
                //onChangeSelectores();
                //cargaCapaContorno();
                //changeComboEntidades();
                //if(tipoVisualizacionCapas === tipoIZQ) cargaInicialMapa();
            }
        },
        error: function (xhr, err)
        {}
    });
}

//function getselectedvalue(){
//    alert($("#selectorEstatus :selected").val());
//}

function creaComboEstatus()
{
    var id_grupo = $("#selectorGrupos").val()
    var urlObjetivo = './Ajax/AjaxListadoCapasTotales.php';
    var titulo = 'Estatus'; // Información de Hidrocarburos';
    //alert($("#selectorGrupos").val());
    $.ajax(
    {
        url: urlObjetivo,
        type: 'POST',
        dataType: "json",
        data: { id_grupo:id_grupo },
        beforeSend: function ()
        {
        },
        success: function (datos)
        {
            //printObject(datos);
            var datosJSON = JSON.parse(JSON.stringify(datos));
            //printObject(datosJSON);
            if(datosJSON === "") //  No existe la tabal de entidades
            {}
            else
            {
                var html = "";
                var selDeEstatus = "";

                                    
                selDeEstatus += '<h5 style="text-align:left; margin: 0px">' + '<label>' + titulo + '</label>' + '</h5>';    

                    //selDeEstatus += '<label class="col-xs-15 control-label">Seleccione una entidad</label>';
                selDeEstatus += '<select class="form-control" style="margin-bottom: 0px !important"  id="selectorEstatus" onchange="getselectedvalue();">'; 

                selDeEstatus += '<option value="' + 0 + '" selected="selected">' + "Seleccione un Estatus" + '</option>';
                       

                for (var i = 0; i < datosJSON.length; i++)
                {   

                    selDeEstatus += '<option class="optionSelectorEstatus" value="' + datosJSON[i].id_capa  + '" >' + datosJSON[i].titulo + '</option>';  
                }
                
                

                selDeEstatus += '</select>';    

                html += '<div>' + selDeEstatus + '</div>';
            
                $('#divSelectorEstatus').html(html);
                clickCapaEstatusSeleccionado();
            }
        },
        error: function (xhr, err)
        {
            //alert('Erorr: Creacion de Selector de Estatus');
            //$('#resultado').html('');
            //printObject(xhr);
            
        }
    });
}

function printObject(o)
{
    var out = '';
    for (var p in o)
        out += p + ': ' + o[p] + '\n';
    alert(out);
}

function clickCapaEstatusSeleccionado()
{   
    $("#selectorEstatus").change(function() 
    {
        
        $("#selectorEstatus").each(function()
        {
            var idCapa = $("#selectorEstatus").val();

            desapareceCapaDeseleccionada(idCapa);
        });    
        
        $('option[selected="selected"]').not(this).prop('selected', false);

        var idCapa = $("#selectorEstatus").val();
        if($(this.options).is(":selected"))  
        {
    
            //  Se debe mostrar la capa
            cargaCapasEstatus(idCapa);
            //alert($("#selectorEstatus").val());
            //alert(idCapa);
        }
        else
        {
            //  Se debe ocultar la capa
            desapareceCapaDeseleccionada(idCapa);
        }
    });    
}

//cuando se cambia la entidad elegida se acualiza el valor y el enfoque
function changeComboEntidades()
{
    $("#selectorEntidades").change(function() 
    {
        //  Desaparece contorno actual y muestra el contorno seleccionado
        desapareceCapaDeseleccionada('Contorno');
        cargaCapaContorno();
        
        //  Oculta todas las capas y vuelve a mostrarlas todas
        //  Obtiene todas las capas seleccionadas, las desaparece y las vuelve a 
        $("#selectorEstatus").each(function()
        {
            var idCapa = $("#selectorEstatus").val();
            desapareceCapaDeseleccionada(idCapa);
            cargaCapaSeleccionada(idCapa);
        });        
        
        cambiaEntidadMapa();
    });
}

function changeComboEntidades2()
{
    $("#selectorEntidades").change(function() 
    {
        //  Desaparece contorno actual y muestra el contorno seleccionado
        desapareceCapaDeseleccionada('Contorno');
        cargaCapaContorno();
        
        //  Oculta todas las capas y vuelve a mostrarlas todas
        //  Obtiene todas las capas seleccionadas, las desaparece y las vuelve a 
        $('#verticalTabs').each(function()
        {
            var idCapa = $("#verticalTabs").val();;
            desapareceCapaDeseleccionada(idCapa);
            cargaCapaSeleccionada(idCapa);
        });        
        
        cambiaEntidadMapa();
    });
}




//Esta funcion sirve para actualizar las semanas con base en el modulo que se selecciona
function onChangeSelectores()
{
    $('#selectorGrupos').change(function ()
    {
        creaComboEstatus();
        //creaSelectorJE();
        //creaSelectorEN();
    });
}



function formatearNumeros(numero, numDecimales)
{
    numero = Number(numero).toFixed(numDecimales);
    var parts= numero.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}

function printObject(o)
{
    var out = '';
    for (var p in o)
        out += p + ': ' + o[p] + '\n';
    alert(out);
}

function puntosEntidades(idEntidad)
{
    //  Esquina superior izquierda
    //  Esquina inferior derecha
    //  Centro
    //  Zoom minimo, maximo
    var puntos = 
        [
            [[34.5608999610, -119.1640440517], [14.0182675009, -85.7540484022], [24.2895837, -112.459046], [5.1, 15.0]],   //Nacional
            [[22.47714416, -102.9346824], [21.62898379, -101.8242672], [22.05306398, -102.3794748] , [9.0, 15.0]   ],
            [[32.4597247, -119.2304975],  [27.91237167, -112.3269864], [30.18604819, -115.778742]  , [6.5, 15.0]    ],       //  Checar el borde superior de 02
            [[28.03360892, -115.316024],  [22.89535168, -108.8372094], [25.4644803, -112.0766167]  , [6.5, 15.0]    ],
            [[21.12692048, -92.45464243], [17.62804277, -88.99463041], [19.37748163, -90.72463642] , [7.5, 15.0]    ],
            [[29.9334219, -104.1653506],  [24.44726199, -99.63172233], [27.19034195, -101.8985365] , [6.5, 15.0]    ],
            [[19.53500455, -104.8745975], [18.66273087, -103.3725899], [19.09886771, -104.1235937] , [9.0, 15.0]   ],
            [[18.08335536, -94.27263423], [14.40156306, -90.33854393], [16.24245921, -92.30558908] , [7.3, 15.0]    ],
            [[31.84672392, -109.3670603], [25.63740146, -103.0069929], [28.74206269, -106.1870266] , [6.4, 15.0]    ],
            [[19.60449395, -99.43032112], [19.05203703, -98.89170189], [19.32826549, -99.16101151] , [10.0, 15.0]  ],
            [[26.86992068, -107.5029889], [22.31912789, -102.108293],  [24.59452429, -104.805641]  , [6.9, 15.0]    ],
            [[21.85545185, -102.2349581], [19.87686331, -99.59589602], [20.86615758, -100.9154271] , [8.0, 15.0]   ],
            [[18.96896392, -102.2558301], [16.18931209, -97.9629472],  [17.57913801, -100.1093887] , [7.8, 15.0]    ],
            [[21.42613843, -99.97924371], [19.58082597, -97.88552959], [20.5034822, -98.93238665]  , [8.3, 15.0]   ],
            [[22.77022858, -106.1245949], [18.90313575, -101.1876672], [20.83668217, -103.6561311] , [7.0, 15.0]    ],
            [[20.31628696, -100.6562569], [18.32018898, -98.47160615], [19.31823797, -99.56393153] , [8.1, 15.0]   ],       //  15
            [[20.40834102, -103.8761751], [17.8884149, -99.98645318],  [19.14837796, -101.9313141] , [7.7, 15.0]   ],
            [[19.14398553, -99.51996738], [18.33618075, -98.56520172], [18.74008314, -99.04258455] , [9.5, 15.0]   ],
            [[23.07880641, -106.9005769], [20.59598463, -103.5246153], [21.83739552, -105.2125961] , [7.8, 15.0]    ],
            [[27.86115667, -101.40292],   [23.1216138, -98.36159987],  [25.49138524, -99.88225994] , [6.9, 15.0]    ],
            [[18.75731324, -98.56920052], [15.51670411, -93.87785622], [17.13700868, -96.22352837] , [7.5, 15.0]    ],
            [[20.89083595, -99.09408667], [17.80947147, -96.61840165], [19.35015371, -97.85624416] , [7.6, 15.0]    ],       //  21
            [[21.69854338, -100.6379543], [19.99230493, -98.87872445], [20.84542416, -99.75833938] , [8.4, 15.0]   ],
            [[21.86338081, -89.42857435], [17.64461475, -86.85862043], [19.75399778, -88.14359739] , [7.3, 15.0]    ],
            [[24.54198042, -102.4942335], [21.11730143, -98.23124153], [22.82964093, -100.3627375] , [7.4, 15.0]    ],
            [[27.04950032, -109.84015],   [22.4395312, -105.306251],   [24.74451576, -107.5732005] , [6.9, 15.0]    ],
            [[32.55104826, -115.2936836], [26.32592863, -107.973465],  [29.43848845, -111.6335743] , [6.4, 15.0]    ],
            [[18.74191531, -94.16666688], [17.02320424, -90.94194609], [17.88255978, -92.55430649] , [8.5, 15.0]   ],       //  27
            [[27.7210141, -100.2562884],  [22.1447195, -97.15673934],  [24.9328668, -98.70651387]  , [6.6, 15.0]    ],
            [[19.74368209, -98.71990345], [19.06577365, -97.61489365], [19.40472787, -98.16739855] , [9.8, 15.0]    ],
            [[22.52609915, -98.85719518], [17.03839006, -93.49831176], [19.78224461, -96.17775347] , [6.7, 15.0]    ],
            [[22.69802764, -90.36664731], [19.36889964, -87.6043464],  [21.03346364, -88.98549686] , [7.3, 15.0]    ],
            [[25.1311981, -104.5641973],  [21.03024122, -100.6445599], [23.08071966, -102.6043786] , [7.1, 15.0]    ]
        ];

    return puntos[idEntidad];
}

function quitaLinkLeaflet()
{
    $('a[href="http://leafletjs.com"]').remove();
}

function quita000webhost()
{
    $('a[href="https://cdn.000webhost.com/000webhost/logo/footer-powered-by-000webhost-white2.png"]').remove();
}


function estiloPuntos(feature, campoValor, categorizacion, registroTablaEstilo, elIcono)
{
    //  Hay un icono
    if(elIcono !== null)
    {
        return {    icon: elIcono,  color: registroTablaEstilo.color   };
    }

    var geojsonMarkerOptions = 
    {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    //  Si hay datos de estilo, los asigna (base)
    if(registroTablaEstilo !== null && registroTablaEstilo !== undefined)    //  Se modifica con los datos recibidos de la consulta
    {
        geojsonMarkerOptions.radius = registroTablaEstilo.radio;
        geojsonMarkerOptions.fillColor = registroTablaEstilo.color;
        geojsonMarkerOptions.color = registroTablaEstilo.color;
        geojsonMarkerOptions.weight = registroTablaEstilo.peso;
        geojsonMarkerOptions.opacity = registroTablaEstilo.transp_linea;
        geojsonMarkerOptions.fillOpacity = registroTablaEstilo.transp_relleno;
    }    
    
    //  si hay categorizacion, asigna el color necesario
    if(categorizacion.length > 0)
    {
        var fillColor = '';
        var valor = parseFloat(feature.properties[campoValor]);
        
        for (var i = 0; i < categorizacion.length; i++)
        {
            if(valor >= parseFloat(categorizacion[i].val_min) && valor <= parseFloat(categorizacion[i].val_max))
                fillColor = categorizacion[i].color;
        }

        if (fillColor === '')    fillColor = "#f7f7f7";  // no data

        //geojsonLineOptions.color = registroTablaEstilo.color;
        geojsonMarkerOptions.fillColor = fillColor;
    }
    
    return geojsonMarkerOptions;
}

function estiloLineas(registroTablaEstilo)
{
    //  https://www.wrld3d.com/wrld.js/latest/docs/leaflet/L.Polyline/#path-option
    var geojsonLineOptions = 
        {
            stroke: 1,
            color: "#000",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.02,
            lineCap: 'round',
            lineJoin: 'round'
        };    

    if(registroTablaEstilo !== null)    //  Se modifica con los datos recibidos de la consulta
    {
        //geojsonLineOptions.stroke = registroTablaEstilo.radio;
        geojsonLineOptions.color = registroTablaEstilo.color;
        geojsonLineOptions.weight = registroTablaEstilo.peso;
        geojsonLineOptions.opacity = registroTablaEstilo.transp_linea;
        geojsonLineOptions.fillOpacity = registroTablaEstilo.transp_relleno;        
    }
    
    return geojsonLineOptions;
}

function estiloCoropletas(feature, campoValor, categorizacion, registroTablaEstilo)
{   
    //  https://www.wrld3d.com/wrld.js/latest/docs/leaflet/L.Polyline/#path-option
    var geojsonLineOptions = 
        {
            color: "#000",
            fillColor:"#000",
            weight: 1,
            opacity: 0.2,
            fillOpacity: 1,
            lineCap: 'round',
            lineJoin: 'round'
        };

    if(registroTablaEstilo !== null)    //  Se modifica con los datos recibidos de la consulta
    {
        var fillColor = '';
        var weight = '';
        var opacity = '';
        var fillOpacity = '';
        var valor = parseFloat(feature.properties[campoValor] == null ? 0 : feature.properties[campoValor]);

        for (var i = 0; i < categorizacion.length; i++)
        {
            if(valor >= parseFloat(categorizacion[i].val_min) && valor <= parseFloat(categorizacion[i].val_max))
                fillColor = categorizacion[i].color;
        }

        //  Si no hay coloración por categorización, ponle el fijo del estilo registrado
        if (fillColor === '')   fillColor = (registroTablaEstilo.color === null || registroTablaEstilo.color === '') ? "#f7f7f7" : registroTablaEstilo.color;
                                weight    = (registroTablaEstilo.color === null || registroTablaEstilo.color === '') ? 1 : registroTablaEstilo.peso;
                                opacity   = (registroTablaEstilo.color === null || registroTablaEstilo.color === '') ? 0.2 : registroTablaEstilo.transp_linea;
                            fillOpacity   = (registroTablaEstilo.color === null || registroTablaEstilo.color === '') ? 1 : registroTablaEstilo.transp_relleno;

        geojsonLineOptions.fillColor = fillColor;
        geojsonLineOptions.weight = weight;
        geojsonLineOptions.opacity = opacity;
        geojsonLineOptions.fillOpacity = fillOpacity;
    }
    
    return geojsonLineOptions;
}


function estiloCapaContorno()
{
    //  https://www.wrld3d.com/wrld.js/latest/docs/leaflet/L.Polyline/#path-option
    var geojsonLineOptions = 
        {
            stroke: 1,
            color: "#000",
            weight: 2,
            opacity: 1,
            fillOpacity: 0,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false
        };    
    
    return geojsonLineOptions;
}

function cambiaFormatoFecha(fecha, tipo)
{
    var resultado = '';
    var laFecha = new Date(fecha);
    var elAnio = laFecha.getFullYear();
    var elMes = laFecha.getMonth();
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
               
    if(elAnio === undefined || isNaN(elAnio) || elMes === undefined || isNaN(elMes))
        return resultado;
    
    switch(tipo)
    {
        case 1: resultado = meses[elMes] + ' ' + elAnio;    break;                
    }
    
    return resultado;
}

function tieneCategorias(idCapa, categorias)
{
    for (var i = 0; i < categorias.length; i++)
    {
        if(categorias[i].id_capa == idCapa)
            return true;
    }
    
    return false;
}

function muestraOcultaLoading(muestra)
{
    if(muestra)
        $('#loadingMapa').show();
    else
        $('#loadingMapa').hide();
}



