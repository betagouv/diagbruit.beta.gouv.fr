{% macro repair_geometry(geometry_column, is_valid_column, method='structure') %}
    CASE
        WHEN {{ is_valid_column }} THEN {{ geometry_column }}
        ELSE 
            -- Try to repair, but if it fails, keep the original geometry
            COALESCE(
                ST_MakeValid({{ geometry_column }}, 'method={{ method }}'),
                {{ geometry_column }}
            )
    END
{% endmacro %}