shaderbase = """

#define COLOR2FLOAT(c) (length((c).xyz) / sqrt(3.0))

"""

eevee_closure_code = """
struct Closure {
	vec3 radiance;
	float opacity;
#  ifdef USE_SSS
	vec4 sss_data;
#    ifdef USE_SSS_ALBEDO
	vec3 sss_albedo;
#    endif
#  endif
	vec4 ssr_data;
	vec2 ssr_normal;
	int ssr_id;
};

/* This is hacking ssr_id to tag transparent bsdf */
#define TRANSPARENT_CLOSURE_FLAG -2
#define REFRACT_CLOSURE_FLAG -3
#define NO_SSR -999

#  ifdef USE_SSS
#    ifdef USE_SSS_ALBEDO
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec3(0.0), vec4(0.0), vec2(0.0), -1)
#    else
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec4(0.0), vec2(0.0), -1)
#    endif
#  else
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec2(0.0), -1)
#  endif

uniform int outputSsrId;

Closure cast_closure(vec4 color)
{
    Closure ret = CLOSURE_DEFAULT;
    
    ret.radiance = color.rgb;
    ret.opacity = color.a;
    
    return ret;
}

Closure closure_mix(Closure cl1, Closure cl2, float fac)
{
	Closure cl;

	if (cl1.ssr_id == TRANSPARENT_CLOSURE_FLAG) {
		cl1.ssr_normal = cl2.ssr_normal;
		cl1.ssr_data = cl2.ssr_data;
		cl1.ssr_id = cl2.ssr_id;
#  ifdef USE_SSS
		cl1.sss_data = cl2.sss_data;
#    ifdef USE_SSS_ALBEDO
		cl1.sss_albedo = cl2.sss_albedo;
#    endif
#  endif
	}
	if (cl2.ssr_id == TRANSPARENT_CLOSURE_FLAG) {
		cl2.ssr_normal = cl1.ssr_normal;
		cl2.ssr_data = cl1.ssr_data;
		cl2.ssr_id = cl1.ssr_id;
#  ifdef USE_SSS
		cl2.sss_data = cl1.sss_data;
#    ifdef USE_SSS_ALBEDO
		cl2.sss_albedo = cl1.sss_albedo;
#    endif
#  endif
	}
	if (cl1.ssr_id == outputSsrId) {
		cl.ssr_data = mix(cl1.ssr_data.xyzw, vec4(vec3(0.0), cl1.ssr_data.w), fac); /* do not blend roughness */
		cl.ssr_normal = cl1.ssr_normal;
		cl.ssr_id = cl1.ssr_id;
	}
	else {
		cl.ssr_data = mix(vec4(vec3(0.0), cl2.ssr_data.w), cl2.ssr_data.xyzw, fac); /* do not blend roughness */
		cl.ssr_normal = cl2.ssr_normal;
		cl.ssr_id = cl2.ssr_id;
	}
	cl.opacity = mix(cl1.opacity, cl2.opacity, fac);
	cl.radiance = mix(cl1.radiance * cl1.opacity, cl2.radiance * cl2.opacity, fac);
	cl.radiance /= max(1e-8, cl.opacity);

#  ifdef USE_SSS
	cl.sss_data.rgb = mix(cl1.sss_data.rgb, cl2.sss_data.rgb, fac);
	cl.sss_data.a = (cl1.sss_data.a > 0.0) ? cl1.sss_data.a : cl2.sss_data.a;
#    ifdef USE_SSS_ALBEDO
	/* TODO Find a solution to this. Dither? */
	cl.sss_albedo = (cl1.sss_data.a > 0.0) ? cl1.sss_albedo : cl2.sss_albedo;
#    endif
#  endif

	return cl;
}

Closure closure_add(Closure cl1, Closure cl2)
{
	Closure cl = (cl1.ssr_id == outputSsrId) ? cl1 : cl2;
#  ifdef USE_SSS
	cl.sss_data = (cl1.sss_data.a > 0.0) ? cl1.sss_data : cl2.sss_data;
#    ifdef USE_SSS_ALBEDO
	/* TODO Find a solution to this. Dither? */
	cl.sss_albedo = (cl1.sss_data.a > 0.0) ? cl1.sss_albedo : cl2.sss_albedo;
#    endif
#  endif
	cl.radiance = cl1.radiance + cl2.radiance;
	cl.opacity = saturate(cl1.opacity + cl2.opacity);
	return cl;
}

Closure closure_emission(vec3 rgb)
{
	Closure cl = CLOSURE_DEFAULT;
	cl.radiance = rgb;
	return cl;
}
"""
