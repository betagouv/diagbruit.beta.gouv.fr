{% macro transform_to_epsg_4326(geometry_column, source_srid=2154) %}
    ST_Transform({{ geometry_column }}, 4326)
{% endmacro %}