#ifndef TIMEINTEGRATION_H
#define TIMEINTEGRATION_H

#include <Eigen/Dense>

// ------------------------------------------------------------------------------------
namespace PBD
{
	class TimeIntegration
	{
	public:
		// -------------- semi-implicit Euler (symplectic Euler) -----------------------------------------------------
		static void semiImplicitEuler(
			const float h,
			const float mass,
			Eigen::Vector3f &position,
			Eigen::Vector3f &velocity,
			const Eigen::Vector3f &acceleration);

		// -------------- semi-implicit Euler (symplectic Euler) for rotational part of a rigid body -----------------
		static void semiImplicitEulerRotation(
			const float h,
			const float mass,
			const Eigen::Matrix3f &invInertiaW,
			Eigen::Quaternionf &rotation,
			Eigen::Vector3f &angularVelocity,
			const Eigen::Vector3f &torque);


		// -------------- velocity update (first order) -----------------------------------------------------
		static void velocityUpdateFirstOrder(
			const float h,
			const float mass,
			const Eigen::Vector3f &position,				// position after constraint projection	at time t+h
			const Eigen::Vector3f &oldPosition,				// position before constraint projection at time t
			Eigen::Vector3f &velocity);

		// -------------- angular velocity update (first order)  ------------------------------------------------
		static void angularVelocityUpdateFirstOrder(
			const float h,
			const float mass,
			const Eigen::Quaternionf &rotation,				// rotation after constraint projection	at time t+h
			const Eigen::Quaternionf &oldRotation,			// rotation before constraint projection at time t
			Eigen::Vector3f &angularVelocity);


		// -------------- velocity update (second order) -----------------------------------------------------
		static void velocityUpdateSecondOrder(
			const float h,
			const float mass,
			const Eigen::Vector3f &position,				// position after constraint projection	at time t+h
			const Eigen::Vector3f &oldPosition,				// position before constraint projection at time t
			const Eigen::Vector3f &positionOfLastStep,		// position of last simulation step at time t-h
			Eigen::Vector3f &velocity);

		// -------------- angular velocity update (second order)  ------------------------------------------------
		static void angularVelocityUpdateSecondOrder(
			const float h,
			const float mass,
			const Eigen::Quaternionf &rotation,				// rotation after constraint projection	at time t+h
			const Eigen::Quaternionf &oldRotation,			// rotation before constraint projection at time t
			const Eigen::Quaternionf &rotationOfLastStep,	// rotation of last simulation step at time t-h
			Eigen::Vector3f &angularVelocity);

	};
}

#endif