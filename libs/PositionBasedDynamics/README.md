# PositionBasedDynamics

This library supports the physically-based simulation of mechanical effects. In the last years position-based simulation methods have become popular in the graphics community. In contrast to classical simulation approaches these methods compute the position changes in each simulation step directly, based on the solution of a quasi-static problem. Therefore, position-based approaches are fast, stable and controllable which make them well-suited for use in interactive environments. However, these methods are generally not as accurate as force-based methods but still provide visual plausibility. Hence, the main application areas of position-based simulation are virtual reality, computer games and special effects in movies and commercials.

The PositionBasedDynamics library allows the position-based handling of many types of constraints in a physically-based simulation. The library uses [CMake](http://www.cmake.org/), [Eigen](http://eigen.tuxfamily.org/) and [AntTweakBar](http://anttweakbar.sourceforge.net/) (only for the demos). All external dependencies are included. 

Until now the library was only tested on a Windows system. However, it should also be possible to use it on Linux and Mac OS X systems. 

**Author**: [Jan Bender](http://www.interactive-graphics.de), **License**: MIT

## Features

* Physically-based simulation with position-based constraint handling.
* Library supports many constraints: point-point, point-edge, point-triangle and edge-edge distance constraints, dihedral bending constraint, isometric bending, volume constraint, shape matching, FEM-based PBD (2D & 3D), strain-based dynamics (2D & 3D) and position-based fluids.
* Simple interface
* Demos 
* Library is free even for commercial applications.

## References

* J. Bender, M. M�ller and M. Macklin, "Position-Based Simulation Methods in Computer Graphics", In Tutorial Proceedings of Eurographics, 2015
* J. Bender, D. Koschier, P. Charrier and D. Weber, ""Position-based simulation of continuous materials", Computers & Graphics 44, 2014
* J. Bender, M. M�ller, M. A. Otaduy, M. Teschner and M. Macklin, "A Survey on Position-Based Simulation Methods in Computer Graphics", Computer Graphics Forum 33, 6, 2014
* C. Deul, P. Charrier and J. Bender, "Position-Based Rigid Body Dynamics", Computer Animation and Virtual Worlds, 2014
* M. Macklin, M. M�ller, N. Chentanez and T.Y. Kim, "Unified particle physics for real-time applications", ACM Trans. Graph. 33, 4, 2014
* M. M�ller, N. Chentanez, T.Y. Kim, M. Macklin, "Strain based dynamics", In Proceedings of the 2014 ACM
SIGGRAPH/Eurographics Symposium on Computer Animation, 2014
* J. Bender, D. Weber and R. Diziol, "Fast and stable cloth simulation based on multi-resolution shape matching", Computers & Graphics 37, 8, 2013
* R. Diziol, J. Bender and D. Bayer, "Robust Real-Time Deformation of Incompressible Surface Meshes", In Proceedings of ACM SIGGRAPH / EUROGRAPHICS Symposium on Computer Animation (SCA), 2011
* M. M�ller and N. Chentanez, "Solid simulation with oriented particles", ACM Trans. Graph. 30, 4, 2011
* M. M�ller, "Hierarchical Position Based Dynamics", In VRIPHYS 08: Fifth Workshop in Virtual Reality Interactions and Physical Simulations, 2008 
* M. M�ller, B. Heidelberger, M. Hennix and J. Ratcliff, "Position based dynamics", Journal of Visual Communication and Image Representation 18, 2, 2007
* M. M�ller, B. Heidelberger, M. Teschner and M. Gross, "Meshless deformations based on shape matching", ACM Trans. Graph. 24, 3, 2005
* M. Macklin and M. M�ller, "Position based fluids", ACM Trans. Graph. 32, 4, 2013



